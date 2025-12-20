import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Stock } from './stock.entity';
import { StockMovement } from '../movements/stock-movement.entity';
import { StockEventsService } from './stock-events.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
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
  async setStock(productId: string, warehouseId: string, quantity: number, reason?: string, createdBy?: string): Promise<Stock> {
    this.logger.log(`Setting stock for ${productId} in ${warehouseId} to ${quantity}`, 'StockService');

    let stock = await this.getStock(productId, warehouseId);

    if (!stock) {
      stock = this.stockRepository.create({
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

    await this.stockRepository.save(stock);

    // Record movement
    await this.recordMovement({
      productId,
      type: 'adjustment',
      quantity: quantity - oldQuantity,
      toWarehouseId: warehouseId,
      reason: reason || 'Stock adjustment',
      createdBy,
    });

    // Publish events
    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Increment stock (add to existing)
   */
  async incrementStock(productId: string, warehouseId: string, quantity: number, reason?: string, createdBy?: string): Promise<Stock> {
    this.logger.log(`Incrementing stock for ${productId} in ${warehouseId} by ${quantity}`, 'StockService');

    let stock = await this.getStock(productId, warehouseId);

    if (!stock) {
      stock = this.stockRepository.create({
        productId,
        warehouseId,
        quantity: 0,
        reserved: 0,
        available: 0,
      });
    }

    stock.quantity += quantity;
    stock.available = stock.quantity - stock.reserved;

    await this.stockRepository.save(stock);

    // Record movement
    await this.recordMovement({
      productId,
      type: 'in',
      quantity,
      toWarehouseId: warehouseId,
      reason: reason || 'Stock received',
      createdBy,
    });

    // Publish events
    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Decrement stock (remove from existing)
   */
  async decrementStock(productId: string, warehouseId: string, quantity: number, reason?: string, createdBy?: string): Promise<Stock> {
    this.logger.log(`Decrementing stock for ${productId} in ${warehouseId} by ${quantity}`, 'StockService');

    const stock = await this.getStock(productId, warehouseId);

    if (!stock) {
      throw new NotFoundException(`Stock not found for product ${productId} in warehouse ${warehouseId}`);
    }

    if (stock.available < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${stock.available}, Requested: ${quantity}`);
    }

    stock.quantity -= quantity;
    stock.available = stock.quantity - stock.reserved;

    await this.stockRepository.save(stock);

    // Record movement
    await this.recordMovement({
      productId,
      type: 'out',
      quantity: -quantity,
      fromWarehouseId: warehouseId,
      reason: reason || 'Stock shipped',
      createdBy,
    });

    // Publish events
    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(productId: string, warehouseId: string, quantity: number, orderId: string): Promise<Stock> {
    this.logger.log(`Reserving ${quantity} stock for ${productId} in ${warehouseId}, order: ${orderId}`, 'StockService');

    const stock = await this.getStock(productId, warehouseId);

    if (!stock) {
      throw new NotFoundException(`Stock not found for product ${productId} in warehouse ${warehouseId}`);
    }

    if (stock.available < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${stock.available}, Requested: ${quantity}`);
    }

    stock.reserved += quantity;
    stock.available = stock.quantity - stock.reserved;

    await this.stockRepository.save(stock);

    // Record movement
    await this.recordMovement({
      productId,
      type: 'reserve',
      quantity,
      toWarehouseId: warehouseId,
      reference: orderId,
      reason: `Reserved for order ${orderId}`,
    });

    // Publish events
    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Release reserved stock (cancel reservation)
   */
  async unreserveStock(productId: string, warehouseId: string, quantity: number, orderId: string): Promise<Stock> {
    this.logger.log(`Unreserving ${quantity} stock for ${productId} in ${warehouseId}, order: ${orderId}`, 'StockService');

    const stock = await this.getStock(productId, warehouseId);

    if (!stock) {
      throw new NotFoundException(`Stock not found for product ${productId} in warehouse ${warehouseId}`);
    }

    stock.reserved = Math.max(0, stock.reserved - quantity);
    stock.available = stock.quantity - stock.reserved;

    await this.stockRepository.save(stock);

    // Record movement
    await this.recordMovement({
      productId,
      type: 'unreserve',
      quantity,
      toWarehouseId: warehouseId,
      reference: orderId,
      reason: `Released reservation for order ${orderId}`,
    });

    // Publish events
    await this.publishStockEvents(stock);

    return stock;
  }

  /**
   * Record stock movement
   */
  private async recordMovement(data: Partial<StockMovement>): Promise<StockMovement> {
    const movement = this.movementRepository.create(data);
    return this.movementRepository.save(movement);
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

