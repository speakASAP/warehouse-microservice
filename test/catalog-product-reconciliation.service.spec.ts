import 'reflect-metadata';
import axios from 'axios';
import { CatalogProductReconciliationService } from '../src/stock/catalog-product-reconciliation.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CatalogProductReconciliationService', () => {
  const logger = {
    warn: jest.fn(),
  };

  function queryBuilder(rows: unknown[]) {
    return {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rows),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CATALOG_SERVICE_URL = 'http://catalog-microservice:3200';
  });

  it('reports Warehouse stock product IDs that Catalog rejects as unknown', async () => {
    const builder = queryBuilder([
      { productId: '11111111-1111-4111-8111-111111111111', stockRowCount: '1', totalQuantity: '3', totalReserved: '1', totalAvailable: '2' },
      { productId: 'missing-product', stockRowCount: '1', totalQuantity: '5', totalReserved: '0', totalAvailable: '5' },
    ]);
    const stockRepository = {
      createQueryBuilder: jest.fn(() => builder),
      find: jest.fn(async () => [
        {
          productId: 'missing-product',
          warehouseId: 'warehouse-1',
          quantity: 5,
          reserved: 0,
          available: 5,
          warehouse: {
            code: 'OWN-PRG',
            name: 'Prague Main',
            type: 'own',
            supplierId: null,
          },
        },
      ]),
    };
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/11111111-1111-4111-8111-111111111111')) {
        return {
          status: 200,
          data: {
            success: true,
            data: {
              id: '11111111-1111-4111-8111-111111111111',
              sku: 'SKU-1',
              title: 'Known Product',
            },
          },
        };
      }
      throw { response: { status: 404 }, message: 'not found' };
    });

    const service = new CatalogProductReconciliationService(stockRepository as any, logger as any);
    const report = await service.getReport();

    expect(builder.limit).toHaveBeenCalledWith(500);
    expect(report.totals).toMatchObject({
      stockRows: 2,
      uniqueProductIds: 2,
      knownProductIds: 1,
      unknownProductIds: 1,
      catalogUnavailableProductIds: 0,
      totalQuantity: 8,
      totalReserved: 1,
      totalAvailable: 7,
    });
    expect(report.unknownProducts).toEqual([
      expect.objectContaining({
        productId: 'missing-product',
        status: 'unknown',
        catalogStatus: 404,
        stockRows: [
          expect.objectContaining({
            warehouseId: 'warehouse-1',
            warehouseCode: 'OWN-PRG',
            quantity: 5,
          }),
        ],
      }),
    ]);
    expect(report.knownProducts).toBeUndefined();
  });

  it('separates Catalog dependency failures from unknown products', async () => {
    const stockRepository = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(async (options) => {
        if (options.relations) {
          return [{
            productId: 'product-1',
            warehouseId: 'warehouse-1',
            quantity: 2,
            reserved: 0,
            available: 2,
          }];
        }
        return [{
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          quantity: 2,
          reserved: 0,
          available: 2,
        }];
      }),
    };
    mockedAxios.get.mockRejectedValue({ response: { status: 503 }, message: 'catalog down' });

    const service = new CatalogProductReconciliationService(stockRepository as any, logger as any);
    const report = await service.getReport({ productIds: 'product-1', includeKnown: true });

    expect(report.requestedProductIds).toEqual(['product-1']);
    expect(report.totals).toMatchObject({
      knownProductIds: 0,
      unknownProductIds: 0,
      catalogUnavailableProductIds: 1,
    });
    expect(report.catalogUnavailableProducts).toEqual([
      expect.objectContaining({
        productId: 'product-1',
        status: 'catalog_unavailable',
        catalogStatus: 503,
        catalogError: 'catalog down',
      }),
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      'Catalog product identity lookup failed for product-1 with status 503',
      'CatalogProductReconciliationService',
    );
  });
});
