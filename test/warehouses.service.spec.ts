import 'reflect-metadata';
import { Stock } from '../src/stock/stock.entity';
import { Warehouse } from '../src/warehouses/warehouse.entity';
import { WarehousesService } from '../src/warehouses/warehouses.service';

describe('WarehousesService inventory topology', () => {
  function createService(warehouses: Partial<Warehouse>[], stockRows: Partial<Stock>[]) {
    const warehouseRepository = {
      find: jest.fn().mockResolvedValue(warehouses),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (warehouse) => warehouse),
    };

    const stockRepository = {
      find: jest.fn(async ({ where } = {}) => stockRows.filter((stock) => {
        const productCriteria = where?.productId;
        const warehouseCriteria = where?.warehouseId;
        const productValues = productCriteria?._value ?? productCriteria?.value;
        const warehouseValues = warehouseCriteria?._value ?? warehouseCriteria?.value;
        const productMatches = Array.isArray(productValues)
          ? productValues.includes(stock.productId)
          : !productCriteria || productCriteria === stock.productId;
        const warehouseMatches = Array.isArray(warehouseValues)
          ? warehouseValues.includes(stock.warehouseId)
          : !warehouseCriteria || warehouseCriteria === stock.warehouseId;
        return productMatches && warehouseMatches;
      })),
    };

    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    return {
      service: new WarehousesService(warehouseRepository as any, stockRepository as any, logger as any),
      warehouseRepository,
      stockRepository,
    };
  }

  it('groups local and supplier-managed warehouses with stock totals', async () => {
    const { service } = createService([
      {
        id: 'warehouse-own',
        code: 'OWN-PRG',
        name: 'Prague Main Warehouse',
        type: 'own',
        priority: 20,
        city: 'Prague',
        country: 'CZ',
        supplierId: null,
      },
      {
        id: 'warehouse-dropship',
        code: 'SUP-ACME',
        name: 'Acme Dropship Warehouse',
        type: 'dropship',
        priority: 5,
        city: 'Brno',
        country: 'CZ',
        supplierId: 'supplier-acme',
      },
    ], [
      {
        productId: 'product-1',
        warehouseId: 'warehouse-own',
        quantity: 8,
        reserved: 2,
        available: 6,
      },
      {
        productId: 'product-1',
        warehouseId: 'warehouse-dropship',
        quantity: 11,
        reserved: 1,
        available: 10,
      },
      {
        productId: 'product-2',
        warehouseId: 'warehouse-dropship',
        quantity: 3,
        reserved: 0,
        available: 3,
      },
    ]);

    const topology = await service.getInventoryTopology();

    expect(topology.totals).toEqual({
      totalQuantity: 22,
      totalReserved: 3,
      totalAvailable: 19,
      productsWithStock: 2,
      warehouseCount: 2,
      ownWarehouseCount: 1,
      supplierWarehouseCount: 1,
    });
    expect(topology.groups.own).toEqual([
      expect.objectContaining({
        warehouseId: 'warehouse-own',
        originType: 'own',
        isSupplierManaged: false,
        totalAvailable: 6,
        productsWithStock: 1,
      }),
    ]);
    expect(topology.groups.dropship).toEqual([
      expect.objectContaining({
        warehouseId: 'warehouse-dropship',
        originType: 'dropship',
        supplierId: 'supplier-acme',
        isSupplierManaged: true,
        totalAvailable: 13,
        productsWithStock: 2,
      }),
    ]);
  });

  it('filters topology stock rows by catalog product id while keeping warehouse directory shape', async () => {
    const { service, stockRepository } = createService([
      {
        id: 'warehouse-own',
        code: 'OWN-PRG',
        name: 'Prague Main Warehouse',
        type: 'own',
        priority: 20,
      },
      {
        id: 'warehouse-supplier',
        code: 'SUP-BETA',
        name: 'Beta Supplier Warehouse',
        type: 'supplier',
        priority: 1,
        supplierId: 'supplier-beta',
      },
    ], [
      {
        productId: 'product-1',
        warehouseId: 'warehouse-supplier',
        quantity: 4,
        reserved: 1,
        available: 3,
      },
    ]);

    const topology = await service.getInventoryTopology(' product-1 ');

    expect(stockRepository.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        productId: 'product-1',
      }),
    }));
    expect(topology.productId).toBe('product-1');
    expect(topology.totals.totalAvailable).toBe(3);
    expect(topology.totals.warehouseCount).toBe(2);
    expect(topology.groups.own[0]).toEqual(expect.objectContaining({
      warehouseId: 'warehouse-own',
      totalQuantity: 0,
      totalReserved: 0,
      totalAvailable: 0,
      productsWithStock: 0,
    }));
    expect(topology.groups.supplier[0]).toEqual(expect.objectContaining({
      warehouseId: 'warehouse-supplier',
      supplierId: 'supplier-beta',
      totalAvailable: 3,
    }));
  });

  it('builds a product logistics plan from local, supplier, and dropship stock origins', async () => {
    const { service } = createService([
      { id: 'warehouse-own', code: 'OWN-PRG', name: 'Prague Main Warehouse', type: 'own', priority: 20 },
      { id: 'warehouse-supplier', code: 'SUP-BETA', name: 'Beta Supplier Warehouse', type: 'supplier', priority: 10, supplierId: 'supplier-beta' },
      { id: 'warehouse-dropship', code: 'DROP-ACME', name: 'Acme Dropship Warehouse', type: 'dropship', priority: 5, supplierId: 'supplier-acme' },
    ], [
      { productId: 'product-1', warehouseId: 'warehouse-own', quantity: 2, reserved: 0, available: 2 },
      { productId: 'product-1', warehouseId: 'warehouse-supplier', quantity: 4, reserved: 1, available: 3 },
      { productId: 'product-1', warehouseId: 'warehouse-dropship', quantity: 9, reserved: 0, available: 9 },
    ]);

    const plan = await service.getProductLogistics(' product-1 ');

    expect(plan.productId).toBe('product-1');
    expect(plan.preferredRoute).toBe('local_fulfillment');
    expect(plan.totals).toEqual({
      totalQuantity: 15,
      totalReserved: 1,
      totalAvailable: 14,
      routeCount: 3,
      ownAvailable: 2,
      supplierAvailable: 3,
      dropshipAvailable: 9,
    });
    expect(plan.options.map((option) => option.routeType)).toEqual([
      'local_fulfillment',
      'supplier_replenishment',
      'supplier_dropship',
    ]);
    expect(plan.options[0]).toEqual(expect.objectContaining({
      warehouseId: 'warehouse-own',
      canReserveFromWarehouse: true,
      requiresSupplierCoordination: false,
      available: 2,
      legs: [{ sequence: 1, from: 'OWN-PRG', to: 'customer', responsibility: 'warehouse' }],
    }));
    expect(plan.options[1]).toEqual(expect.objectContaining({
      warehouseId: 'warehouse-supplier',
      supplierId: 'supplier-beta',
      requiresSupplierCoordination: true,
      legs: [
        { sequence: 1, from: 'SUP-BETA', to: 'alfares_receiving_or_handoff', responsibility: 'supplier' },
        { sequence: 2, from: 'alfares_receiving_or_handoff', to: 'customer', responsibility: 'warehouse' },
      ],
    }));
    expect(plan.options[2]).toEqual(expect.objectContaining({
      warehouseId: 'warehouse-dropship',
      routeType: 'supplier_dropship',
      requiresSupplierCoordination: true,
      legs: [{ sequence: 1, from: 'DROP-ACME', to: 'customer', responsibility: 'supplier' }],
    }));
  });


  it('keeps reserved-only supplier routes visible but not reservable', async () => {
    const { service } = createService([
      { id: 'warehouse-supplier', code: 'SUP-BETA', name: 'Beta Supplier Warehouse', type: 'supplier', priority: 10, supplierId: 'supplier-beta' },
    ], [
      { productId: 'product-1', warehouseId: 'warehouse-supplier', quantity: 4, reserved: 4, available: 0 },
    ]);

    const plan = await service.getProductLogistics('product-1');

    expect(plan.totals).toMatchObject({
      totalQuantity: 4,
      totalReserved: 4,
      totalAvailable: 0,
      routeCount: 1,
      supplierAvailable: 0,
    });
    expect(plan.preferredRoute).toBeNull();
    expect(plan.options[0]).toEqual(expect.objectContaining({
      routeType: 'supplier_replenishment',
      available: 0,
      canReserveFromWarehouse: false,
      requiresSupplierCoordination: true,
      legs: [
        { sequence: 1, from: 'SUP-BETA', to: 'alfares_receiving_or_handoff', responsibility: 'supplier' },
        { sequence: 2, from: 'alfares_receiving_or_handoff', to: 'customer', responsibility: 'warehouse' },
      ],
    }));
  });

  it('keeps supplier-managed routes without supplier linkage visible but not reservable', async () => {
    const { service } = createService([
      { id: 'warehouse-supplier', code: 'SUP-MISSING', name: 'Unlinked Supplier Warehouse', type: 'supplier', priority: 10, supplierId: null },
      { id: 'warehouse-dropship', code: 'DROP-MISSING', name: 'Unlinked Dropship Warehouse', type: 'dropship', priority: 8, supplierId: null },
    ], [
      { productId: 'product-1', warehouseId: 'warehouse-supplier', quantity: 5, reserved: 1, available: 4 },
      { productId: 'product-1', warehouseId: 'warehouse-dropship', quantity: 3, reserved: 0, available: 3 },
    ]);

    const plan = await service.getProductLogistics('product-1');

    expect(plan.preferredRoute).toBeNull();
    expect(plan.options).toEqual([
      expect.objectContaining({
        warehouseId: 'warehouse-supplier',
        routeType: 'supplier_replenishment',
        supplierId: null,
        available: 4,
        canReserveFromWarehouse: false,
        requiresSupplierCoordination: true,
        legs: [
          { sequence: 1, from: 'SUP-MISSING', to: 'alfares_receiving_or_handoff', responsibility: 'supplier' },
          { sequence: 2, from: 'alfares_receiving_or_handoff', to: 'customer', responsibility: 'warehouse' },
        ],
      }),
      expect.objectContaining({
        warehouseId: 'warehouse-dropship',
        routeType: 'supplier_dropship',
        supplierId: null,
        available: 3,
        canReserveFromWarehouse: false,
        requiresSupplierCoordination: true,
        legs: [{ sequence: 1, from: 'DROP-MISSING', to: 'customer', responsibility: 'supplier' }],
      }),
    ]);
  });

  it('prefers the first reservable route instead of an earlier diagnostic route', async () => {
    const { service } = createService([
      { id: 'warehouse-diagnostic', code: 'SUP-MISSING', name: 'Unlinked Supplier Warehouse', type: 'supplier', priority: 50, supplierId: null },
      { id: 'warehouse-dropship', code: 'DROP-ACME', name: 'Acme Dropship Warehouse', type: 'dropship', priority: 5, supplierId: 'supplier-acme' },
    ], [
      { productId: 'product-1', warehouseId: 'warehouse-diagnostic', quantity: 9, reserved: 0, available: 9 },
      { productId: 'product-1', warehouseId: 'warehouse-dropship', quantity: 3, reserved: 0, available: 3 },
    ]);

    const plan = await service.getProductLogistics('product-1');

    expect(plan.options.map((option) => [option.routeType, option.canReserveFromWarehouse])).toEqual([
      ['supplier_replenishment', false],
      ['supplier_dropship', true],
    ]);
    expect(plan.preferredRoute).toBe('supplier_dropship');
  });

  it('returns batch product logistics in request order', async () => {
    const { service } = createService([
      { id: 'warehouse-own', code: 'OWN-PRG', name: 'Prague Main Warehouse', type: 'own', priority: 20 },
    ], [
      { productId: 'product-1', warehouseId: 'warehouse-own', quantity: 2, reserved: 0, available: 2 },
      { productId: 'product-2', warehouseId: 'warehouse-own', quantity: 3, reserved: 1, available: 2 },
    ]);

    const plans = await service.getBatchProductLogistics(['product-2', 'product-1']);

    expect(plans.map((plan) => plan.productId)).toEqual(['product-2', 'product-1']);
    expect(plans[0].totals.totalAvailable).toBe(2);
    expect(plans[1].totals.totalAvailable).toBe(2);
  });

});
