import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { StockMovement } from '../src/movements/stock-movement.entity';
import { StockReservation } from '../src/reservations/stock-reservation.entity';
import { Stock } from '../src/stock/stock.entity';
import { SupplierReconciliationService } from '../src/suppliers/supplier-reconciliation.service';
import { SupplierStockReconciliation } from '../src/suppliers/supplier-stock-reconciliation.entity';
import { Warehouse } from '../src/warehouses/warehouse.entity';

describe('SupplierReconciliationService', () => {
  const request = {
    supplierId: 'supplier-1',
    warehouseId: 'warehouse-1',
    productId: 'product-1',
    quantity: 7,
    externalReference: 'feed-123',
    actor: 'suppliers-microservice',
    observedAt: '2026-06-12T10:00:00.000Z',
  };

  function createService(options: {
    warehouse?: Partial<Warehouse>;
    stock?: Partial<Stock>;
    existingReconciliation?: Partial<SupplierStockReconciliation>;
    activeReservationCount?: number;
  } = {}) {
    const warehouse = options.warehouse ?? {
      id: 'warehouse-1',
      type: 'dropship',
      supplierId: 'supplier-1',
    };

    const reconciliationRepository = {
      findOne: jest.fn().mockResolvedValue(options.existingReconciliation ?? null),
      create: jest.fn((data) => data),
      save: jest.fn(async (reconciliation) => reconciliation),
    };

    const warehouseRepository = {
      findOne: jest.fn().mockResolvedValue(warehouse),
    };

    const stockRepository = {
      findOne: jest.fn().mockResolvedValue(options.stock ?? {
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 10,
        reserved: 2,
        available: 8,
        lowStockThreshold: 5,
      }),
      create: jest.fn((data) => data),
      save: jest.fn(async (stock) => stock),
    };

    const reservationRepository = {
      count: jest.fn().mockResolvedValue(options.activeReservationCount ?? 1),
    };

    const movementRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(async (movement) => movement),
    };

    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === SupplierStockReconciliation) return reconciliationRepository;
        if (entity === Warehouse) return warehouseRepository;
        if (entity === Stock) return stockRepository;
        if (entity === StockReservation) return reservationRepository;
        if (entity === StockMovement) return movementRepository;
        throw new Error(`Unexpected repository ${entity?.name}`);
      }),
    };

    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };

    const stockEvents = {
      publishStockUpdated: jest.fn().mockResolvedValue({ type: 'stock.updated', status: 'published', timestamp: '2026-06-12T10:00:00.000Z' }),
      publishStockLow: jest.fn().mockResolvedValue({ type: 'stock.low', status: 'published', timestamp: '2026-06-12T10:00:00.000Z' }),
      publishStockOut: jest.fn().mockResolvedValue({ type: 'stock.out', status: 'published', timestamp: '2026-06-12T10:00:00.000Z' }),
    };

    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const operationalMetrics = {
      recordMutationSuccess: jest.fn(),
      recordMutationFailure: jest.fn(),
    };

    return {
      service: new SupplierReconciliationService(reconciliationRepository as any, dataSource as any, stockEvents as any, logger as any, operationalMetrics as any),
      reconciliationRepository,
      stockRepository,
      movementRepository,
      stockEvents,
      operationalMetrics,
    };
  }

  it('applies a supplier quantity update and records movement evidence', async () => {
    const { service, stockRepository, movementRepository, reconciliationRepository, stockEvents } = createService();

    const reconciliation = await service.reconcile(request);

    expect(stockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 7,
      reserved: 2,
      available: 5,
    }));
    expect(movementRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'product-1',
      type: 'supplier_reconciliation',
      quantity: -3,
      toWarehouseId: 'warehouse-1',
      reference: 'feed-123',
      reason: 'SUPPLIER_DROPSHIP_RECONCILIATION',
      createdBy: 'suppliers-microservice',
    }));
    expect(reconciliationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'applied',
      supplierQuantity: 7,
      previousQuantity: 10,
      reservedQuantity: 2,
    }));
    expect(stockEvents.publishStockUpdated).toHaveBeenCalledWith('product-1', 'warehouse-1', 7, 5);
    expect(reconciliation.status).toBe('applied');
  });

  it('returns the existing reconciliation when a supplier reference is replayed', async () => {
    const existingReconciliation = {
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      productId: 'product-1',
      externalReference: 'feed-123',
      status: 'applied' as const,
    };
    const { service, stockRepository, movementRepository, reconciliationRepository } = createService({ existingReconciliation });

    const reconciliation = await service.reconcile(request);

    expect(reconciliation).toBe(existingReconciliation);
    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(movementRepository.save).not.toHaveBeenCalled();
    expect(reconciliationRepository.save).not.toHaveBeenCalled();
  });

  it('records a conflict when supplier quantity is below active reserved stock', async () => {
    const { service, stockRepository, movementRepository, reconciliationRepository } = createService({
      stock: {
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 10,
        reserved: 4,
        available: 6,
        lowStockThreshold: 5,
      },
      activeReservationCount: 2,
    });

    const reconciliation = await service.reconcile({ ...request, quantity: 3 });

    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(movementRepository.save).not.toHaveBeenCalled();
    expect(reconciliationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'conflict',
      supplierQuantity: 3,
      reservedQuantity: 4,
      conflictReason: expect.stringContaining('below reserved quantity 4'),
    }));
    expect(reconciliation.status).toBe('conflict');
  });


  it('rejects supplier-managed warehouses that are not linked to a supplier', async () => {
    const { service, stockRepository } = createService({
      warehouse: {
        id: 'warehouse-1',
        type: 'supplier',
        supplierId: null,
      },
    });

    await expect(service.reconcile(request)).rejects.toThrow('is supplier-managed but is not linked to a supplier');

    expect(stockRepository.save).not.toHaveBeenCalled();
  });

  it('rejects supplier reconciliation when the warehouse belongs to another supplier', async () => {
    const { service, stockRepository } = createService({
      warehouse: {
        id: 'warehouse-1',
        type: 'dropship',
        supplierId: 'supplier-2',
      },
    });

    await expect(service.reconcile(request)).rejects.toThrow('belongs to supplier supplier-2');

    expect(stockRepository.save).not.toHaveBeenCalled();
  });

  it('rejects reconciliation into an own warehouse', async () => {
    const { service, stockRepository } = createService({
      warehouse: {
        id: 'warehouse-1',
        type: 'own',
      },
    });

    await expect(service.reconcile(request)).rejects.toBeInstanceOf(BadRequestException);

    expect(stockRepository.save).not.toHaveBeenCalled();
  });
});
