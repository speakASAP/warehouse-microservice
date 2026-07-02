import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockMovement } from '../movements/stock-movement.entity';
import { OperationalMetricsService } from '../observability/operational-metrics.service';
import { StockReservation } from '../reservations/stock-reservation.entity';
import { StockEventsService, StockEventPublishResult } from '../stock/stock-events.service';
import { Stock } from '../stock/stock.entity';
import { Warehouse } from '../warehouses/warehouse.entity';
import { LoggerService } from '../logger/logger.service';
import {
  SupplierConflictReviewDto,
  SupplierReconciliationQueryDto,
  SupplierStockReconciliationDto,
} from './dto/supplier-stock-reconciliation.dto';
import { SupplierStockReconciliation } from './supplier-stock-reconciliation.entity';

@Injectable()
export class SupplierReconciliationService {
  constructor(
    @InjectRepository(SupplierStockReconciliation)
    private readonly reconciliationRepository: Repository<SupplierStockReconciliation>,
    private readonly dataSource: DataSource,
    private readonly stockEvents: StockEventsService,
    private readonly logger: LoggerService,
    private readonly operationalMetrics: OperationalMetricsService,
  ) {}

  async list(query: SupplierReconciliationQueryDto = {}): Promise<SupplierStockReconciliation[]> {
    const status = query.status || 'conflict';
    const limit = Math.min(Math.max(Number(query.limit || 50), 1), 200);
    const builder = this.reconciliationRepository.createQueryBuilder('reconciliation')
      .where('reconciliation.status = :status', { status })
      .orderBy('reconciliation.createdAt', 'DESC')
      .take(limit);

    if (query.supplierId) {
      builder.andWhere('reconciliation.supplierId = :supplierId', { supplierId: query.supplierId });
    }
    if (query.warehouseId) {
      builder.andWhere('reconciliation.warehouseId = :warehouseId', { warehouseId: query.warehouseId });
    }
    if (query.productId) {
      builder.andWhere('reconciliation.productId = :productId', { productId: query.productId });
    }
    if (query.externalReference) {
      builder.andWhere('reconciliation.externalReference = :externalReference', { externalReference: query.externalReference });
    }
    if (query.reviewed === true) {
      builder.andWhere('reconciliation.reviewedAt IS NOT NULL');
    }
    if (query.reviewed === false) {
      builder.andWhere('reconciliation.reviewedAt IS NULL');
    }
    if (query.createdFrom) {
      builder.andWhere('reconciliation.createdAt >= :createdFrom', { createdFrom: new Date(query.createdFrom) });
    }
    if (query.createdTo) {
      builder.andWhere('reconciliation.createdAt <= :createdTo', { createdTo: new Date(query.createdTo) });
    }

    return builder.getMany();
  }

  async reviewConflict(id: string, body: SupplierConflictReviewDto): Promise<SupplierStockReconciliation> {
    return this.dataSource.transaction(async (manager) => {
      const reconciliationRepository = manager.getRepository(SupplierStockReconciliation);
      const reconciliation = await reconciliationRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!reconciliation) {
        throw new NotFoundException(`Supplier reconciliation ${id} not found`);
      }
      if (reconciliation.status !== 'conflict') {
        throw new BadRequestException('Only conflict reconciliations can be reviewed');
      }

      if (!reconciliation.reviewedAt) {
        reconciliation.reviewedAt = new Date();
        reconciliation.reviewedBy = body.actor;
      } else if (!reconciliation.reviewedBy) {
        reconciliation.reviewedBy = body.actor;
      }

      if (body.operatorNote !== undefined) {
        const note = body.operatorNote.trim();
        reconciliation.operatorNote = note || null;
      }

      return reconciliationRepository.save(reconciliation);
    });
  }

  async reconcile(body: SupplierStockReconciliationDto): Promise<SupplierStockReconciliation> {
    const quantity = this.normalizeSupplierQuantity(body.quantity);

    this.logger.log(
      `Reconciling supplier stock ${body.supplierId}/${body.productId}/${body.externalReference}`,
      'SupplierReconciliationService',
    );

    const observedAt = body.observedAt ? new Date(body.observedAt) : new Date();
    if (Number.isNaN(observedAt.getTime())) {
      throw new BadRequestException('observedAt must be a valid date');
    }

    try {
      const result = await this.dataSource.transaction(async (manager) => {
      const reconciliationRepository = manager.getRepository(SupplierStockReconciliation);
      const warehouse = await manager.getRepository(Warehouse).findOne({
        where: { id: body.warehouseId },
        lock: { mode: 'pessimistic_read' },
      });
      if (!warehouse) {
        throw new NotFoundException(`Warehouse ${body.warehouseId} not found`);
      }

      if (!['supplier', 'dropship'].includes(warehouse.type)) {
        throw new BadRequestException(`Warehouse ${body.warehouseId} is not a supplier dropship location`);
      }

      if (!warehouse.supplierId) {
        throw new BadRequestException(`Warehouse ${body.warehouseId} is supplier-managed but is not linked to a supplier`);
      }

      if (warehouse.supplierId !== body.supplierId) {
        throw new BadRequestException(`Warehouse ${body.warehouseId} belongs to supplier ${warehouse.supplierId}`);
      }

      const existing = await reconciliationRepository.findOne({
        where: {
          supplierId: body.supplierId,
          warehouseId: body.warehouseId,
          productId: body.productId,
          externalReference: body.externalReference,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (existing) {
        return { reconciliation: existing, stock: null as Stock | null };
      }

      const stockRepository = manager.getRepository(Stock);
      let stock = await stockRepository.findOne({
        where: { productId: body.productId, warehouseId: body.warehouseId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!stock) {
        stock = stockRepository.create({
          productId: body.productId,
          warehouseId: body.warehouseId,
          quantity: 0,
          reserved: 0,
          available: 0,
        });
      }

      const previousQuantity = stock.quantity;
      const reservedQuantity = stock.reserved;
      const activeReservations = await manager.getRepository(StockReservation).count({
        where: {
          productId: body.productId,
          warehouseId: body.warehouseId,
          status: 'active',
        },
      });

      if (quantity < reservedQuantity) {
        const reconciliation = reconciliationRepository.create({
          supplierId: body.supplierId,
          warehouseId: body.warehouseId,
          productId: body.productId,
          supplierQuantity: quantity,
          previousQuantity,
          reservedQuantity,
          externalReference: body.externalReference,
          status: 'conflict',
          conflictReason: `Supplier quantity ${quantity} is below reserved quantity ${reservedQuantity} across ${activeReservations} active reservation(s)`,
          actor: body.actor,
          observedAt,
        });

        return {
          reconciliation: await reconciliationRepository.save(reconciliation),
          stock: null as Stock | null,
        };
      }

      stock.quantity = quantity;
      stock.available = stock.quantity - stock.reserved;
      const savedStock = await stockRepository.save(stock);

      await manager.getRepository(StockMovement).save(manager.getRepository(StockMovement).create({
        productId: body.productId,
        type: 'supplier_reconciliation',
        quantity: quantity - previousQuantity,
        toWarehouseId: body.warehouseId,
        reference: body.externalReference,
        reason: 'SUPPLIER_DROPSHIP_RECONCILIATION',
        createdBy: body.actor,
      }));

      const reconciliation = reconciliationRepository.create({
        supplierId: body.supplierId,
        warehouseId: body.warehouseId,
        productId: body.productId,
        supplierQuantity: quantity,
        previousQuantity,
        reservedQuantity,
        externalReference: body.externalReference,
        status: 'applied',
        actor: body.actor,
        observedAt,
      });

      return {
        reconciliation: await reconciliationRepository.save(reconciliation),
        stock: savedStock,
      };
      });

      const eventResults = result.stock ? await this.publishStockEvents(result.stock) : [];
      this.logReconciliationMutation(body, result.reconciliation.status, eventResults);
      this.operationalMetrics.recordMutationSuccess({
        operation: 'supplier_reconciliation',
        productId: body.productId,
        warehouseId: body.warehouseId,
        actor: body.actor,
        reasonCode: 'SUPPLIER_DROPSHIP_RECONCILIATION',
        reference: body.externalReference,
      });

      return result.reconciliation;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logReconciliationMutation(body, 'failure', [], message);
      this.operationalMetrics.recordMutationFailure({
        operation: 'supplier_reconciliation',
        productId: body.productId,
        warehouseId: body.warehouseId,
        actor: body.actor,
        reasonCode: 'SUPPLIER_DROPSHIP_RECONCILIATION',
        reference: body.externalReference,
        error: message,
      });
      throw error;
    }
  }

  private normalizeSupplierQuantity(quantity: SupplierStockReconciliationDto['quantity'] | string | null | undefined): number {
    if (quantity === undefined || quantity === null) {
      return 0;
    }
    if (typeof quantity === 'string' && quantity.trim() === '') {
      return 0;
    }
    const normalizedQuantity = Number(quantity);
    if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 0) {
      throw new BadRequestException('quantity must be a non-negative integer');
    }
    return normalizedQuantity;
  }

  private async publishStockEvents(stock: Stock): Promise<StockEventPublishResult[]> {
    const results: StockEventPublishResult[] = [];
    results.push(await this.stockEvents.publishStockUpdated(stock.productId, stock.warehouseId, stock.quantity, stock.available));

    if (stock.available > 0 && stock.available <= stock.lowStockThreshold) {
      results.push(await this.stockEvents.publishStockLow(stock.productId, stock.warehouseId, stock.available, stock.lowStockThreshold));
    }

    if (stock.available <= 0) {
      results.push(await this.stockEvents.publishStockOut(stock.productId, stock.warehouseId));
    }

    return results;
  }

  private logReconciliationMutation(
    body: SupplierStockReconciliationDto,
    status: string,
    eventResults: StockEventPublishResult[],
    error?: string,
  ) {
    const eventResult = eventResults.map((result) => `${result.type}:${result.status}`).join(',') || 'none';
    const fields = [
      `status=${status}`,
      'operation=supplier_reconciliation',
      `actor=${body.actor}`,
      `supplierId=${body.supplierId}`,
      `productId=${body.productId}`,
      `warehouseId=${body.warehouseId}`,
      `quantity=${this.normalizeSupplierQuantity(body.quantity)}`,
      'reasonCode=SUPPLIER_DROPSHIP_RECONCILIATION',
      `reference=${body.externalReference}`,
      `eventResult=${eventResult}`,
      error ? `error=${error}` : null,
    ].filter(Boolean).join(' ');

    if (status === 'failure') {
      this.logger.error(`stock_mutation ${fields}`, '', 'SupplierReconciliationService');
    } else {
      this.logger.log(`stock_mutation ${fields}`, 'SupplierReconciliationService');
    }
  }
}
