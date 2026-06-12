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
import { SupplierStockReconciliationDto } from './dto/supplier-stock-reconciliation.dto';
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

  async reconcile(body: SupplierStockReconciliationDto): Promise<SupplierStockReconciliation> {
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

      if (warehouse.supplierId && warehouse.supplierId !== body.supplierId) {
        throw new BadRequestException(`Warehouse ${body.warehouseId} belongs to supplier ${warehouse.supplierId}`);
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

      if (body.quantity < reservedQuantity) {
        const reconciliation = reconciliationRepository.create({
          supplierId: body.supplierId,
          warehouseId: body.warehouseId,
          productId: body.productId,
          supplierQuantity: body.quantity,
          previousQuantity,
          reservedQuantity,
          externalReference: body.externalReference,
          status: 'conflict',
          conflictReason: `Supplier quantity ${body.quantity} is below reserved quantity ${reservedQuantity} across ${activeReservations} active reservation(s)`,
          actor: body.actor,
          observedAt,
        });

        return {
          reconciliation: await reconciliationRepository.save(reconciliation),
          stock: null as Stock | null,
        };
      }

      stock.quantity = body.quantity;
      stock.available = stock.quantity - stock.reserved;
      const savedStock = await stockRepository.save(stock);

      await manager.getRepository(StockMovement).save(manager.getRepository(StockMovement).create({
        productId: body.productId,
        type: 'supplier_reconciliation',
        quantity: body.quantity - previousQuantity,
        toWarehouseId: body.warehouseId,
        reference: body.externalReference,
        reason: 'SUPPLIER_DROPSHIP_RECONCILIATION',
        createdBy: body.actor,
      }));

      const reconciliation = reconciliationRepository.create({
        supplierId: body.supplierId,
        warehouseId: body.warehouseId,
        productId: body.productId,
        supplierQuantity: body.quantity,
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
      `quantity=${body.quantity}`,
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
