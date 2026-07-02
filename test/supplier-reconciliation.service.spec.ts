import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { StockMovement } from '../src/movements/stock-movement.entity';
import { StockReservation } from '../src/reservations/stock-reservation.entity';
import { Stock } from '../src/stock/stock.entity';
import { SupplierReconciliationService } from '../src/suppliers/supplier-reconciliation.service';
import { SupplierStockReconciliationDto } from '../src/suppliers/dto/supplier-stock-reconciliation.dto';
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
    listedReconciliations?: Partial<SupplierStockReconciliation>[];
    activeReservationCount?: number;
  } = {}) {
    const warehouse = options.warehouse ?? {
      id: 'warehouse-1',
      type: 'dropship',
      supplierId: 'supplier-1',
    };

    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(options.listedReconciliations ?? []),
    };

    const reconciliationRepository = {
      findOne: jest.fn().mockResolvedValue(options.existingReconciliation ?? null),
      create: jest.fn((data) => data),
      save: jest.fn(async (reconciliation) => reconciliation),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
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
      queryBuilder,
    };
  }

  it.each([
    ['absent', {}],
    ['null', { quantity: null }],
    ['blank', { quantity: '' }],
    ['whitespace', { quantity: '   ' }],
  ])('defaults %s supplier reconciliation quantity to zero at the DTO validation boundary', async (_label, quantityPayload) => {
    const dto = plainToInstance(SupplierStockReconciliationDto, {
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      productId: 'product-1',
      externalReference: 'feed-missing-quantity',
      ...quantityPayload,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.quantity).toBe(0);
  });

  it.each([
    ['negative', -1],
    ['fractional', 1.5],
    ['non-numeric', 'not-a-number'],
  ])('rejects %s supplier reconciliation quantity at the DTO validation boundary', async (_label, quantity) => {
    const dto = plainToInstance(SupplierStockReconciliationDto, {
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      productId: 'product-1',
      externalReference: 'feed-invalid-quantity',
      quantity,
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('quantity');
  });

  it('defaults a missing direct reconciliation quantity to zero before writing stock evidence', async () => {
    const { service, stockRepository, movementRepository, reconciliationRepository, stockEvents } = createService({
      stock: {
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 10,
        reserved: 0,
        available: 10,
        lowStockThreshold: 5,
      },
      activeReservationCount: 0,
    });

    const reconciliation = await service.reconcile({
      ...request,
      quantity: undefined as unknown as number,
      externalReference: 'feed-missing-quantity',
    });

    expect(stockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 0,
      reserved: 0,
      available: 0,
    }));
    expect(movementRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      quantity: -10,
      reference: 'feed-missing-quantity',
    }));
    expect(reconciliationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'applied',
      supplierQuantity: 0,
      previousQuantity: 10,
      reservedQuantity: 0,
    }));
    expect(stockEvents.publishStockUpdated).toHaveBeenCalledWith('product-1', 'warehouse-1', 0, 0);
    expect(stockEvents.publishStockOut).toHaveBeenCalledWith('product-1', 'warehouse-1');
    expect(reconciliation.status).toBe('applied');
  });

  it.each([
    ['negative', -1],
    ['fractional', 1.5],
    ['non-numeric', 'not-a-number' as unknown as number],
  ])('rejects %s direct reconciliation quantity before writing stock evidence', async (_label, quantity) => {
    const { service, stockRepository, movementRepository, reconciliationRepository, stockEvents } = createService();

    await expect(service.reconcile({
      ...request,
      quantity,
      externalReference: 'feed-invalid-quantity',
    })).rejects.toThrow('quantity must be a non-negative integer');

    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(movementRepository.save).not.toHaveBeenCalled();
    expect(reconciliationRepository.save).not.toHaveBeenCalled();
    expect(stockEvents.publishStockUpdated).not.toHaveBeenCalled();
  });

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

  it('returns the existing reconciliation when a supplier reference is replayed after validating warehouse ownership', async () => {
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

  it('rejects replayed reconciliation when the warehouse is no longer linked to the request supplier', async () => {
    const existingReconciliation = {
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      productId: 'product-1',
      externalReference: 'feed-123',
      status: 'applied' as const,
    };
    const { service, stockRepository, movementRepository, reconciliationRepository } = createService({
      existingReconciliation,
      warehouse: {
        id: 'warehouse-1',
        type: 'dropship',
        supplierId: 'supplier-2',
      },
    });

    await expect(service.reconcile(request)).rejects.toThrow('belongs to supplier supplier-2');

    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(movementRepository.save).not.toHaveBeenCalled();
    expect(reconciliationRepository.save).not.toHaveBeenCalled();
  });

  it('lists supplier conflicts with composable filters', async () => {
    const listedReconciliations = [{
      id: 'rec-1',
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      productId: 'product-1',
      externalReference: 'feed-123',
      status: 'conflict' as const,
    }];
    const { service, queryBuilder } = createService({ listedReconciliations });

    const result = await service.list({
      supplierId: 'supplier-1',
      productId: 'product-1',
      reviewed: false,
      limit: 25,
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('reconciliation.status = :status', { status: 'conflict' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('reconciliation.supplierId = :supplierId', { supplierId: 'supplier-1' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('reconciliation.productId = :productId', { productId: 'product-1' });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('reconciliation.reviewedAt IS NULL');
    expect(queryBuilder.take).toHaveBeenCalledWith(25);
    expect(result).toBe(listedReconciliations);
  });

  it('marks a supplier conflict reviewed without changing stock or movement evidence', async () => {
    const existingReconciliation = {
      id: 'rec-1',
      supplierId: 'supplier-1',
      warehouseId: 'warehouse-1',
      productId: 'product-1',
      externalReference: 'feed-123',
      status: 'conflict' as const,
      reviewedAt: null,
      reviewedBy: null,
      operatorNote: null,
    };
    const { service, reconciliationRepository, stockRepository, movementRepository, stockEvents } = createService({
      existingReconciliation,
    });

    const reconciliation = await service.reviewConflict('rec-1', {
      actor: 'warehouse-ops',
      operatorNote: 'Checked active reservation queue.',
    });

    expect(reconciliationRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'rec-1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(reconciliationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      reviewedAt: expect.any(Date),
      reviewedBy: 'warehouse-ops',
      operatorNote: 'Checked active reservation queue.',
    }));
    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(movementRepository.save).not.toHaveBeenCalled();
    expect(stockEvents.publishStockUpdated).not.toHaveBeenCalled();
    expect(reconciliation.reviewedBy).toBe('warehouse-ops');
  });

  it('rejects review for non-conflict reconciliation rows', async () => {
    const { service, reconciliationRepository, stockRepository, movementRepository } = createService({
      existingReconciliation: {
        id: 'rec-1',
        status: 'applied' as const,
      },
    });

    await expect(service.reviewConflict('rec-1', {
      actor: 'warehouse-ops',
      operatorNote: 'No conflict.',
    })).rejects.toThrow('Only conflict reconciliations can be reviewed');

    expect(reconciliationRepository.save).not.toHaveBeenCalled();
    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(movementRepository.save).not.toHaveBeenCalled();
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
