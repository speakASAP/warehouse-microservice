import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Stock } from './stock.entity';
import { StockMovement } from '../movements/stock-movement.entity';
import { StockEventsService } from './stock-events.service';
import { LoggerService } from '../logger/logger.service';
import { ReservationStatus, StockReservation } from '../reservations/stock-reservation.entity';

export interface StockMutationContext {
  reasonCode: string;
  actor: string;
  reference?: string;
}

export interface ReservationOptions {
  channel: string;
  expiresAt?: Date | string;
}

interface ReservationLookup {
  productId: string;
  warehouseId: string;
  orderId: string;
  channel?: string;
}

const DEFAULT_RESERVATION_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly dataSource: DataSource,
    private readonly stockEvents: StockEventsService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get stock for a product across all warehouses
   */
  async getStockByProduct(productId: string): Promise<Stock[]> {
    return this.stockRepository.find({
      where: { productId },
      relations: ['warehouse'],
    });
  }

  /**
   * Get total available stock for a product
   */
  async getTotalAvailable(productId: string): Promise<number> {
    const result = await this.stockRepository
      .createQueryBuilder('stock')
      .select('SUM(stock.available)', 'total')
      .where('stock.productId = :productId', { productId })
      .getRawOne();

    return parseInt(result?.total || '0', 10);
  }

  /**
   * Get stock for a specific product in a warehouse
   */
  async getStock(productId: string, warehouseId: string): Promise<Stock | null> {
    return this.stockRepository.findOne({
      where: { productId, warehouseId },
      relations: ['warehouse'],
    });
  }

  /**
   * Set stock quantity (absolute value)
   */
  async setStock(productId: string, warehouseId: string, quantity: number, context: StockMutationContext): Promise<Stock> {
    this.logger.log(`Setting stock for ${productId} in ${warehouseId} to ${quantity}`, 'StockService');
    this.validateMutationContext(context);
    this.validateNonNegativeQuantity(quantity, 'quantity');

    const stock = await this.dataSource.transaction(async (manager) => {
      const stockRepository = manager.getRepository(Stock);
      let stock = await this.findStockForUpdate(manager, productId, warehouseId);

      if (!stock) {
        stock = stockRepository.create({
          productId,
          warehouseId,
          quantity: 0,
          reserved: 0,
          available: 0,
        });
      }

      const oldQuantity = stock.quantity;
      stock.quantity = quantity;
      stock.available = quantity - stock.reserved;
      this.assertValidStockState(stock);

      const savedStock = await stockRepository.save(stock);

      await this.recordMovement(manager, {
        productId,
        type: 'adjustment',
        quantity: quantity - oldQuantity,
        toWarehouseId: warehouseId,
        reference: context.reference,
        reason: context.reasonCode,
        createdBy: context.actor,
      });

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Increment stock (add to existing)
   */
  async incrementStock(productId: string, warehouseId: string, quantity: number, context: StockMutationContext): Promise<Stock> {
    this.logger.log(`Incrementing stock for ${productId} in ${warehouseId} by ${quantity}`, 'StockService');
    this.validateMutationContext(context);
    this.validatePositiveQuantity(quantity, 'quantity');

    const stock = await this.dataSource.transaction(async (manager) => {
      const stockRepository = manager.getRepository(Stock);
      let stock = await this.findStockForUpdate(manager, productId, warehouseId);

      if (!stock) {
        stock = stockRepository.create({
          productId,
          warehouseId,
          quantity: 0,
          reserved: 0,
          available: 0,
        });
      }

      stock.quantity += quantity;
      stock.available = stock.quantity - stock.reserved;
      this.assertValidStockState(stock);

      const savedStock = await stockRepository.save(stock);

      await this.recordMovement(manager, {
        productId,
        type: 'in',
        quantity,
        toWarehouseId: warehouseId,
        reference: context.reference,
        reason: context.reasonCode,
        createdBy: context.actor,
      });

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Decrement stock (remove from existing)
   */
  async decrementStock(productId: string, warehouseId: string, quantity: number, context: StockMutationContext): Promise<Stock> {
    this.logger.log(`Decrementing stock for ${productId} in ${warehouseId} by ${quantity}`, 'StockService');
    this.validateMutationContext(context);
    this.validatePositiveQuantity(quantity, 'quantity');

    const stock = await this.dataSource.transaction(async (manager) => {
      const stockRepository = manager.getRepository(Stock);
      const stock = await this.findStockForUpdate(manager, productId, warehouseId);

      if (!stock) {
        throw new NotFoundException(`Stock not found for product ${productId} in warehouse ${warehouseId}`);
      }

      if (stock.available < quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${stock.available}, Requested: ${quantity}`);
      }

      stock.quantity -= quantity;
      stock.available = stock.quantity - stock.reserved;
      this.assertValidStockState(stock);

      const savedStock = await stockRepository.save(stock);

      await this.recordMovement(manager, {
        productId,
        type: 'out',
        quantity: -quantity,
        fromWarehouseId: warehouseId,
        reference: context.reference,
        reason: context.reasonCode,
        createdBy: context.actor,
      });

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(
    productId: string,
    warehouseId: string,
    quantity: number,
    orderId: string,
    context: StockMutationContext,
    options: ReservationOptions,
  ): Promise<Stock> {
    this.logger.log(`Reserving ${quantity} stock for ${productId} in ${warehouseId}, order: ${orderId}`, 'StockService');
    this.validateMutationContext(context);
    this.validatePositiveQuantity(quantity, 'quantity');
    this.validateRequiredString(orderId, 'orderId');
    this.validateRequiredString(options?.channel, 'channel');
    const expiresAt = this.resolveReservationExpiry(options.expiresAt);

    const stock = await this.dataSource.transaction(async (manager) => {
      const stockRepository = manager.getRepository(Stock);
      const stock = await this.findStockForUpdate(manager, productId, warehouseId);

      if (!stock) {
        throw new NotFoundException(`Stock not found for product ${productId} in warehouse ${warehouseId}`);
      }

      const reservationRepository = manager.getRepository(StockReservation);
      let reservation = await this.findReservationForUpdate(manager, {
        productId,
        warehouseId,
        orderId,
        channel: options.channel,
      }, ['active']);

      const currentReservedQuantity = reservation?.quantity ?? 0;
      const reserveDelta = quantity - currentReservedQuantity;

      if (reserveDelta > 0 && stock.available < reserveDelta) {
        throw new BadRequestException(`Insufficient stock. Available: ${stock.available}, Requested: ${reserveDelta}`);
      }

      stock.reserved += reserveDelta;
      stock.available = stock.quantity - stock.reserved;
      this.assertValidStockState(stock);

      const savedStock = reserveDelta === 0 ? stock : await stockRepository.save(stock);

      if (!reservation) {
        reservation = reservationRepository.create({
          productId,
          warehouseId,
          quantity,
          orderId,
          channel: options.channel,
          status: 'active',
          expiresAt,
        });
      } else {
        reservation.quantity = quantity;
        reservation.expiresAt = expiresAt;
      }

      await reservationRepository.save(reservation);

      if (reserveDelta !== 0) {
        await this.recordMovement(manager, {
          productId,
          type: reserveDelta > 0 ? 'reserve' : 'unreserve',
          quantity: Math.abs(reserveDelta),
          toWarehouseId: warehouseId,
          reference: orderId,
          reason: context.reasonCode,
          createdBy: context.actor,
        });
      }

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Release reserved stock (cancel reservation)
   */
  async unreserveStock(productId: string, warehouseId: string, quantity: number, orderId: string, context: StockMutationContext, channel?: string): Promise<Stock> {
    this.logger.log(`Unreserving ${quantity} stock for ${productId} in ${warehouseId}, order: ${orderId}`, 'StockService');
    this.validateMutationContext(context);
    this.validatePositiveQuantity(quantity, 'quantity');
    this.validateRequiredString(orderId, 'orderId');

    const stock = await this.dataSource.transaction(async (manager) => {
      const stockRepository = manager.getRepository(Stock);
      const stock = await this.findStockForUpdate(manager, productId, warehouseId);

      if (!stock) {
        throw new NotFoundException(`Stock not found for product ${productId} in warehouse ${warehouseId}`);
      }

      const reservation = await this.findReservationForUpdate(manager, { productId, warehouseId, orderId, channel }, ['active']);
      if (!reservation) {
        return this.assertIdempotentReservationTransition(manager, { productId, warehouseId, orderId, channel }, 'released');
      }

      if (reservation.quantity < quantity) {
        throw new BadRequestException(`Cannot release more reserved stock than the reservation holds. Reserved: ${reservation.quantity}, Requested: ${quantity}`);
      }

      if (stock.reserved < quantity) {
        throw new BadRequestException(`Cannot release more reserved stock than exists. Reserved: ${stock.reserved}, Requested: ${quantity}`);
      }

      stock.reserved -= quantity;
      stock.available = stock.quantity - stock.reserved;
      this.assertValidStockState(stock);

      const savedStock = await stockRepository.save(stock);
      const reservationRepository = manager.getRepository(StockReservation);
      if (reservation.quantity === quantity) {
        reservation.status = 'released';
      } else {
        reservation.quantity -= quantity;
      }
      await reservationRepository.save(reservation);

      await this.recordMovement(manager, {
        productId,
        type: 'unreserve',
        quantity,
        toWarehouseId: warehouseId,
        reference: orderId,
        reason: context.reasonCode,
        createdBy: context.actor,
      });

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Fulfill an active reservation after payment succeeds.
   */
  async fulfillReservation(productId: string, warehouseId: string, orderId: string, context: StockMutationContext, channel?: string): Promise<Stock> {
    this.logger.log(`Fulfilling reservation for ${productId} in ${warehouseId}, order: ${orderId}`, 'StockService');
    this.validateMutationContext(context);
    this.validateRequiredString(orderId, 'orderId');

    const stock = await this.dataSource.transaction(async (manager) => {
      const reservation = await this.findReservationForUpdate(manager, { productId, warehouseId, orderId, channel }, ['active']);
      if (!reservation) {
        return this.assertIdempotentReservationTransition(manager, { productId, warehouseId, orderId, channel }, 'fulfilled');
      }

      const stockRepository = manager.getRepository(Stock);
      const stock = await this.findStockForUpdateOrThrow(manager, productId, warehouseId);
      const quantity = reservation.quantity;

      if (stock.reserved < quantity || stock.quantity < quantity) {
        throw new BadRequestException(`Cannot fulfill reservation. Quantity: ${stock.quantity}, Reserved: ${stock.reserved}, Requested: ${quantity}`);
      }

      stock.reserved -= quantity;
      stock.quantity -= quantity;
      stock.available = stock.quantity - stock.reserved;
      this.assertValidStockState(stock);

      const savedStock = await stockRepository.save(stock);
      reservation.status = 'fulfilled';
      await manager.getRepository(StockReservation).save(reservation);

      await this.recordMovement(manager, {
        productId,
        type: 'fulfill',
        quantity: -quantity,
        fromWarehouseId: warehouseId,
        reference: orderId,
        reason: context.reasonCode,
        createdBy: context.actor,
      });

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Cancel an active hold or reverse a fulfilled reservation.
   */
  async cancelReservation(productId: string, warehouseId: string, orderId: string, context: StockMutationContext, channel?: string): Promise<Stock> {
    this.logger.log(`Cancelling reservation for ${productId} in ${warehouseId}, order: ${orderId}`, 'StockService');
    this.validateMutationContext(context);
    this.validateRequiredString(orderId, 'orderId');

    const stock = await this.dataSource.transaction(async (manager) => {
      const reservation = await this.findReservationForUpdate(manager, { productId, warehouseId, orderId, channel }, ['active', 'fulfilled']);
      if (!reservation) {
        return this.assertIdempotentReservationTransition(manager, { productId, warehouseId, orderId, channel }, 'cancelled');
      }

      const stockRepository = manager.getRepository(Stock);
      const stock = await this.findStockForUpdateOrThrow(manager, productId, warehouseId);
      const quantity = reservation.quantity;
      const wasActive = reservation.status === 'active';

      if (wasActive) {
        if (stock.reserved < quantity) {
          throw new BadRequestException(`Cannot cancel reservation. Reserved: ${stock.reserved}, Requested: ${quantity}`);
        }
        stock.reserved -= quantity;
        stock.available = stock.quantity - stock.reserved;
      } else {
        stock.quantity += quantity;
        stock.available = stock.quantity - stock.reserved;
      }

      this.assertValidStockState(stock);

      const savedStock = await stockRepository.save(stock);
      reservation.status = 'cancelled';
      await manager.getRepository(StockReservation).save(reservation);

      await this.recordMovement(manager, {
        productId,
        type: wasActive ? 'unreserve' : 'cancel',
        quantity,
        toWarehouseId: warehouseId,
        reference: orderId,
        reason: context.reasonCode,
        createdBy: context.actor,
      });

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Expire an active reservation after its TTL has elapsed.
   */
  async expireReservation(productId: string, warehouseId: string, orderId: string, context: StockMutationContext, channel?: string, now = new Date()): Promise<Stock> {
    this.logger.log(`Expiring reservation for ${productId} in ${warehouseId}, order: ${orderId}`, 'StockService');
    this.validateMutationContext(context);
    this.validateRequiredString(orderId, 'orderId');

    const stock = await this.dataSource.transaction(async (manager) => {
      const reservation = await this.findReservationForUpdate(manager, { productId, warehouseId, orderId, channel }, ['active']);
      if (!reservation) {
        return this.assertIdempotentReservationTransition(manager, { productId, warehouseId, orderId, channel }, 'expired');
      }

      if (!reservation.expiresAt || reservation.expiresAt.getTime() > now.getTime()) {
        throw new BadRequestException('Reservation has not expired');
      }

      const stockRepository = manager.getRepository(Stock);
      const stock = await this.findStockForUpdateOrThrow(manager, productId, warehouseId);
      const quantity = reservation.quantity;

      if (stock.reserved < quantity) {
        throw new BadRequestException(`Cannot expire reservation. Reserved: ${stock.reserved}, Requested: ${quantity}`);
      }

      stock.reserved -= quantity;
      stock.available = stock.quantity - stock.reserved;
      this.assertValidStockState(stock);

      const savedStock = await stockRepository.save(stock);
      reservation.status = 'expired';
      await manager.getRepository(StockReservation).save(reservation);

      await this.recordMovement(manager, {
        productId,
        type: 'expire',
        quantity,
        toWarehouseId: warehouseId,
        reference: orderId,
        reason: context.reasonCode,
        createdBy: context.actor,
      });

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Restock inventory for a fulfilled reservation return.
   */
  async returnReservation(productId: string, warehouseId: string, orderId: string, context: StockMutationContext, channel?: string): Promise<Stock> {
    this.logger.log(`Returning reservation for ${productId} in ${warehouseId}, order: ${orderId}`, 'StockService');
    this.validateMutationContext(context);
    this.validateRequiredString(orderId, 'orderId');

    const stock = await this.dataSource.transaction(async (manager) => {
      const reservation = await this.findReservationForUpdate(manager, { productId, warehouseId, orderId, channel }, ['fulfilled']);
      if (!reservation) {
        return this.assertIdempotentReservationTransition(manager, { productId, warehouseId, orderId, channel }, 'returned');
      }

      const stockRepository = manager.getRepository(Stock);
      const stock = await this.findStockForUpdateOrThrow(manager, productId, warehouseId);
      const quantity = reservation.quantity;

      stock.quantity += quantity;
      stock.available = stock.quantity - stock.reserved;
      this.assertValidStockState(stock);

      const savedStock = await stockRepository.save(stock);
      reservation.status = 'returned';
      await manager.getRepository(StockReservation).save(reservation);

      await this.recordMovement(manager, {
        productId,
        type: 'return',
        quantity,
        toWarehouseId: warehouseId,
        reference: orderId,
        reason: context.reasonCode,
        createdBy: context.actor,
      });

      return savedStock;
    });

    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Record stock movement
   */
  private async recordMovement(manager: EntityManager, data: Partial<StockMovement>): Promise<StockMovement> {
    const movementRepository = manager.getRepository(StockMovement);
    const movement = movementRepository.create(data);
    return movementRepository.save(movement);
  }

  private async findStockForUpdate(manager: EntityManager, productId: string, warehouseId: string): Promise<Stock | null> {
    return manager.getRepository(Stock).findOne({
      where: { productId, warehouseId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  private async findStockForUpdateOrThrow(manager: EntityManager, productId: string, warehouseId: string): Promise<Stock> {
    const stock = await this.findStockForUpdate(manager, productId, warehouseId);
    if (!stock) {
      throw new NotFoundException(`Stock not found for product ${productId} in warehouse ${warehouseId}`);
    }
    return stock;
  }

  private async findReservationForUpdate(
    manager: EntityManager,
    lookup: ReservationLookup,
    statuses: ReservationStatus[],
  ): Promise<StockReservation | null> {
    const where: Record<string, unknown> = {
      productId: lookup.productId,
      warehouseId: lookup.warehouseId,
      orderId: lookup.orderId,
      status: statuses.length === 1 ? statuses[0] : In(statuses),
    };

    if (lookup.channel) {
      where.channel = lookup.channel;
    }

    return manager.getRepository(StockReservation).findOne({
      where,
      lock: { mode: 'pessimistic_write' },
      order: { createdAt: 'DESC' },
    } as any);
  }

  private async assertIdempotentReservationTransition(
    manager: EntityManager,
    lookup: ReservationLookup,
    status: ReservationStatus,
  ): Promise<Stock> {
    const reservation = await this.findReservationForUpdate(manager, lookup, [status]);
    if (!reservation) {
      throw new BadRequestException(`No active reservation found for order ${lookup.orderId}`);
    }
    return this.findStockForUpdateOrThrow(manager, lookup.productId, lookup.warehouseId);
  }

  private resolveReservationExpiry(expiresAt?: Date | string): Date {
    if (!expiresAt) {
      return new Date(Date.now() + DEFAULT_RESERVATION_TTL_MS);
    }

    const parsed = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('expiresAt must be a valid date');
    }

    return parsed;
  }

  private validateMutationContext(context: StockMutationContext): void {
    if (!context) {
      throw new BadRequestException('Stock mutation context is required');
    }

    this.validateRequiredString(context.reasonCode, 'reasonCode');
    this.validateRequiredString(context.actor, 'actor');
  }

  private validateRequiredString(value: string | undefined, fieldName: string): void {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  private validateNonNegativeQuantity(quantity: number, fieldName: string): void {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new BadRequestException(`${fieldName} must be a non-negative integer`);
    }
  }

  private validatePositiveQuantity(quantity: number, fieldName: string): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }
  }

  private assertValidStockState(stock: Stock): void {
    if (stock.quantity < 0 || stock.reserved < 0 || stock.available < 0) {
      throw new BadRequestException('Stock mutation would create a negative stock state');
    }

    if (stock.reserved > stock.quantity) {
      throw new BadRequestException(`Reserved stock cannot exceed quantity. Quantity: ${stock.quantity}, Reserved: ${stock.reserved}`);
    }

    if (stock.available !== stock.quantity - stock.reserved) {
      throw new BadRequestException('Available stock must equal quantity minus reserved stock');
    }
  }

  /**
   * Publish stock events based on current state
   */
  private async publishStockEvents(stock: Stock): Promise<void> {
    // Always publish stock.updated
    await this.stockEvents.publishStockUpdated(
      stock.productId,
      stock.warehouseId,
      stock.quantity,
      stock.available
    );

    // Check for low stock
    if (stock.available > 0 && stock.available <= stock.lowStockThreshold) {
      await this.stockEvents.publishStockLow(
        stock.productId,
        stock.warehouseId,
        stock.available,
        stock.lowStockThreshold
      );
    }

    // Check for out of stock
    if (stock.available <= 0) {
      await this.stockEvents.publishStockOut(stock.productId, stock.warehouseId);
    }
  }
}
