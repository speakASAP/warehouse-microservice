import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { Stock } from '../stock/stock.entity';
import { Warehouse } from './warehouse.entity';

export type WarehouseTopologyType = 'own' | 'supplier' | 'dropship' | 'other';

export interface WarehouseTopologyStockTotals {
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
  productsWithStock: number;
}

export interface WarehouseTopologyRow extends WarehouseTopologyStockTotals {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  originType: WarehouseTopologyType;
  supplierId: string | null;
  isSupplierManaged: boolean;
  priority: number;
  city: string | null;
  country: string | null;
}

export interface WarehouseInventoryTopology {
  generatedAt: string;
  productId?: string;
  totals: WarehouseTopologyStockTotals & {
    warehouseCount: number;
    ownWarehouseCount: number;
    supplierWarehouseCount: number;
  };
  groups: Record<WarehouseTopologyType, WarehouseTopologyRow[]>;
  warehouses: WarehouseTopologyRow[];
}

export type WarehouseLogisticsRouteType = 'local_fulfillment' | 'supplier_replenishment' | 'supplier_dropship' | 'unclassified';

export interface WarehouseLogisticsLeg {
  sequence: number;
  from: string;
  to: string;
  responsibility: 'warehouse' | 'supplier' | 'mixed';
}

export interface WarehouseLogisticsOption {
  productId: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  originType: WarehouseTopologyType;
  supplierId: string | null;
  priority: number;
  quantity: number;
  reserved: number;
  available: number;
  routeType: WarehouseLogisticsRouteType;
  routeLabel: string;
  canReserveFromWarehouse: boolean;
  requiresSupplierCoordination: boolean;
  legs: WarehouseLogisticsLeg[];
}

export interface WarehouseProductLogisticsPlan {
  generatedAt: string;
  productId: string;
  totals: {
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
    routeCount: number;
    ownAvailable: number;
    supplierAvailable: number;
    dropshipAvailable: number;
  };
  preferredRoute: WarehouseLogisticsRouteType | null;
  options: WarehouseLogisticsOption[];
}

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly logger: LoggerService,
  ) {}

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC', name: 'ASC' },
    });
  }

  async getInventoryTopology(productId?: string): Promise<WarehouseInventoryTopology> {
    const normalizedProductId = this.normalizeOptionalProductId(productId);
    const warehouses = await this.findAll();
    const warehouseIds = warehouses.map((warehouse) => warehouse.id);
    const stockRows = warehouseIds.length > 0
      ? await this.stockRepository.find({
        where: {
          warehouseId: In(warehouseIds),
          ...(normalizedProductId ? { productId: normalizedProductId } : {}),
        },
        order: {
          warehouseId: 'ASC',
          productId: 'ASC',
        },
      } as any)
      : [];

    const stockByWarehouse = new Map<string, Stock[]>();
    for (const stock of stockRows) {
      const rows = stockByWarehouse.get(stock.warehouseId) ?? [];
      rows.push(stock);
      stockByWarehouse.set(stock.warehouseId, rows);
    }

    const groups: Record<WarehouseTopologyType, WarehouseTopologyRow[]> = {
      own: [],
      supplier: [],
      dropship: [],
      other: [],
    };

    const productIds = new Set<string>();
    const rows = warehouses.map((warehouse) => {
      const warehouseStockRows = stockByWarehouse.get(warehouse.id) ?? [];
      const stockTotals = this.calculateStockTotals(warehouseStockRows);
      for (const stock of warehouseStockRows) {
        productIds.add(stock.productId);
      }

      const originType = this.normalizeWarehouseType(warehouse.type);
      const row: WarehouseTopologyRow = {
        warehouseId: warehouse.id,
        warehouseCode: warehouse.code,
        warehouseName: warehouse.name,
        warehouseType: warehouse.type,
        originType,
        supplierId: warehouse.supplierId ?? null,
        isSupplierManaged: originType === 'supplier' || originType === 'dropship' || Boolean(warehouse.supplierId),
        priority: warehouse.priority ?? 0,
        city: warehouse.city ?? null,
        country: warehouse.country ?? null,
        ...stockTotals,
      };
      groups[originType].push(row);
      return row;
    });

    const totals = rows.reduce(
      (accumulator, row) => ({
        totalQuantity: accumulator.totalQuantity + row.totalQuantity,
        totalReserved: accumulator.totalReserved + row.totalReserved,
        totalAvailable: accumulator.totalAvailable + row.totalAvailable,
        productsWithStock: productIds.size,
        warehouseCount: accumulator.warehouseCount + 1,
        ownWarehouseCount: accumulator.ownWarehouseCount + (row.originType === 'own' ? 1 : 0),
        supplierWarehouseCount: accumulator.supplierWarehouseCount + (row.isSupplierManaged ? 1 : 0),
      }),
      {
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
        productsWithStock: productIds.size,
        warehouseCount: 0,
        ownWarehouseCount: 0,
        supplierWarehouseCount: 0,
      },
    );

    return {
      generatedAt: new Date().toISOString(),
      ...(normalizedProductId ? { productId: normalizedProductId } : {}),
      totals,
      groups,
      warehouses: rows,
    };
  }

  async getProductLogistics(productId: string): Promise<WarehouseProductLogisticsPlan> {
    const normalizedProductId = this.normalizeRequiredProductId(productId);
    const topology = await this.getInventoryTopology(normalizedProductId);
    const options = topology.warehouses
      .filter((warehouse) => warehouse.totalQuantity > 0 || warehouse.totalReserved > 0 || warehouse.totalAvailable > 0)
      .map((warehouse) => this.toLogisticsOption(normalizedProductId, warehouse))
      .sort((left, right) => this.compareLogisticsOptions(left, right));

    const totals = options.reduce(
      (accumulator, option) => {
        accumulator.totalQuantity += option.quantity;
        accumulator.totalReserved += option.reserved;
        accumulator.totalAvailable += option.available;
        accumulator.ownAvailable += option.originType === 'own' ? option.available : 0;
        accumulator.supplierAvailable += option.originType === 'supplier' ? option.available : 0;
        accumulator.dropshipAvailable += option.originType === 'dropship' ? option.available : 0;
        return accumulator;
      },
      { totalQuantity: 0, totalReserved: 0, totalAvailable: 0, routeCount: options.length, ownAvailable: 0, supplierAvailable: 0, dropshipAvailable: 0 },
    );

    return {
      generatedAt: new Date().toISOString(),
      productId: normalizedProductId,
      totals,
      preferredRoute: options[0]?.routeType ?? null,
      options,
    };
  }

  async getBatchProductLogistics(productIds: string[]): Promise<WarehouseProductLogisticsPlan[]> {
    const normalizedProductIds = this.normalizeUniqueProductIds(productIds);
    return Promise.all(normalizedProductIds.map((productId) => this.getProductLogistics(productId)));
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('Warehouse ' + id + ' not found');
    }
    return warehouse;
  }

  async create(data: Partial<Warehouse>): Promise<Warehouse> {
    this.logger.log('Creating warehouse: ' + data.name, 'WarehousesService');
    const warehouse = this.warehouseRepository.create(data);
    try {
      return await this.warehouseRepository.save(warehouse);
    } catch (error) {
      this.handlePersistenceError(error, data.code);
    }
  }

  async update(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    Object.assign(warehouse, data);
    try {
      return await this.warehouseRepository.save(warehouse);
    } catch (error) {
      this.handlePersistenceError(error, data.code);
    }
  }

  async remove(id: string): Promise<void> {
    const warehouse = await this.findOne(id);
    warehouse.isActive = false;
    await this.warehouseRepository.save(warehouse);
  }

  private toLogisticsOption(productId: string, warehouse: WarehouseTopologyRow): WarehouseLogisticsOption {
    const route = this.resolveLogisticsRoute(warehouse);
    return {
      productId,
      warehouseId: warehouse.warehouseId,
      warehouseCode: warehouse.warehouseCode,
      warehouseName: warehouse.warehouseName,
      warehouseType: warehouse.warehouseType,
      originType: warehouse.originType,
      supplierId: warehouse.supplierId,
      priority: warehouse.priority,
      quantity: warehouse.totalQuantity,
      reserved: warehouse.totalReserved,
      available: warehouse.totalAvailable,
      ...route,
    };
  }

  private resolveLogisticsRoute(warehouse: WarehouseTopologyRow): Pick<WarehouseLogisticsOption, 'routeType' | 'routeLabel' | 'canReserveFromWarehouse' | 'requiresSupplierCoordination' | 'legs'> {
    if (warehouse.originType === 'own') {
      return {
        routeType: 'local_fulfillment',
        routeLabel: 'Ship from Alfares warehouse to customer',
        canReserveFromWarehouse: true,
        requiresSupplierCoordination: false,
        legs: [{ sequence: 1, from: warehouse.warehouseCode, to: 'customer', responsibility: 'warehouse' }],
      };
    }
    if (warehouse.originType === 'dropship') {
      return {
        routeType: 'supplier_dropship',
        routeLabel: 'Supplier or dropship warehouse ships directly to customer',
        canReserveFromWarehouse: true,
        requiresSupplierCoordination: true,
        legs: [{ sequence: 1, from: warehouse.warehouseCode, to: 'customer', responsibility: 'supplier' }],
      };
    }
    if (warehouse.originType === 'supplier') {
      return {
        routeType: 'supplier_replenishment',
        routeLabel: 'Supplier warehouse replenishes Alfares flow before customer fulfillment',
        canReserveFromWarehouse: true,
        requiresSupplierCoordination: true,
        legs: [
          { sequence: 1, from: warehouse.warehouseCode, to: 'alfares_receiving_or_handoff', responsibility: 'supplier' },
          { sequence: 2, from: 'alfares_receiving_or_handoff', to: 'customer', responsibility: 'warehouse' },
        ],
      };
    }
    return {
      routeType: 'unclassified',
      routeLabel: 'Warehouse origin is not classified; operator review required',
      canReserveFromWarehouse: false,
      requiresSupplierCoordination: Boolean(warehouse.supplierId),
      legs: [{ sequence: 1, from: warehouse.warehouseCode, to: 'operator_review', responsibility: 'mixed' }],
    };
  }

  private compareLogisticsOptions(left: WarehouseLogisticsOption, right: WarehouseLogisticsOption): number {
    const routeRank = (option: WarehouseLogisticsOption) => {
      if (option.routeType === 'local_fulfillment') return 0;
      if (option.routeType === 'supplier_replenishment') return 1;
      if (option.routeType === 'supplier_dropship') return 2;
      return 3;
    };
    return routeRank(left) - routeRank(right) || right.priority - left.priority || right.available - left.available || left.warehouseName.localeCompare(right.warehouseName);
  }

  private calculateStockTotals(stockRows: Stock[]): WarehouseTopologyStockTotals {
    const productIds = new Set<string>();
    const totals = stockRows.reduce(
      (accumulator, stock) => {
        productIds.add(stock.productId);
        accumulator.totalQuantity += stock.quantity;
        accumulator.totalReserved += stock.reserved;
        accumulator.totalAvailable += stock.available;
        return accumulator;
      },
      {
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
        productsWithStock: 0,
      },
    );
    totals.productsWithStock = productIds.size;
    return totals;
  }

  private normalizeWarehouseType(type?: string): WarehouseTopologyType {
    if (type === 'own' || type === 'supplier' || type === 'dropship') {
      return type;
    }
    return 'other';
  }

  private normalizeOptionalProductId(productId?: string): string | undefined {
    const normalized = productId?.trim();
    return normalized || undefined;
  }

  private normalizeRequiredProductId(productId: string): string {
    const normalized = productId?.trim();
    if (!normalized) {
      throw new NotFoundException('Product id is required for logistics planning');
    }
    return normalized;
  }

  private normalizeUniqueProductIds(productIds: string[]): string[] {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new NotFoundException('At least one product id is required for logistics planning');
    }

    const normalized = productIds.map((productId) => this.normalizeRequiredProductId(productId));
    const seen = new Set<string>();
    const duplicate = normalized.find((productId) => {
      if (seen.has(productId)) {
        return true;
      }
      seen.add(productId);
      return false;
    });

    if (duplicate) {
      throw new NotFoundException('Duplicate product id is not allowed for logistics planning: ' + duplicate);
    }

    return normalized;
  }

  private handlePersistenceError(error: unknown, code?: string): never {
    const err = error as { code?: string; detail?: string; message?: string };
    if (err.code === '23505') {
      throw new ConflictException('Warehouse code must be unique' + (code ? ': ' + code : '') + '.');
    }

    this.logger.error(
      'Warehouse persistence failed: ' + (err.message || 'unknown error'),
      undefined,
      'WarehousesService',
    );
    throw new InternalServerErrorException('Warehouse could not be saved. Check the submitted fields and try again.');
  }
}
