import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError } from 'axios';
import { In, Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { Stock } from './stock.entity';

export interface CatalogProductReconciliationOptions {
  productIds?: string[] | string;
  warehouseIds?: string[] | string;
  limit?: number | string;
  includeKnown?: boolean;
}

export interface CatalogProductStockSummary {
  productId: string;
  stockRowCount: number;
  totalQuantity: number;
  totalReserved: number;
  totalAvailable: number;
}

export interface CatalogProductIdentity {
  productId: string;
  sku: string;
  title: string;
}

export interface CatalogProductReconciliationStockRow {
  warehouseId: string;
  warehouseCode?: string | null;
  warehouseName?: string | null;
  warehouseType?: string | null;
  supplierId?: string | null;
  quantity: number;
  reserved: number;
  available: number;
}

export interface CatalogProductReconciliationItem extends CatalogProductStockSummary {
  status: 'known' | 'unknown' | 'catalog_unavailable';
  catalog?: CatalogProductIdentity;
  catalogStatus?: number;
  catalogError?: string;
  stockRows?: CatalogProductReconciliationStockRow[];
}

export interface CatalogProductReconciliationReport {
  generatedAt: string;
  catalogBaseUrl: string;
  source: 'catalog-product-read';
  requestedProductIds: string[];
  checkedProductIds: string[];
  filters: {
    warehouseIds: string[];
    limit: number;
    includeKnown: boolean;
  };
  totals: {
    stockRows: number;
    uniqueProductIds: number;
    knownProductIds: number;
    unknownProductIds: number;
    catalogUnavailableProductIds: number;
    totalQuantity: number;
    totalReserved: number;
    totalAvailable: number;
  };
  unknownProducts: CatalogProductReconciliationItem[];
  catalogUnavailableProducts: CatalogProductReconciliationItem[];
  knownProducts?: CatalogProductReconciliationItem[];
}

@Injectable()
export class CatalogProductReconciliationService {
  private readonly defaultLimit = 500;
  private readonly maxLimit = 1000;

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly logger: LoggerService,
  ) {}

  async getReport(options: CatalogProductReconciliationOptions = {}): Promise<CatalogProductReconciliationReport> {
    const limit = this.normalizeLimit(options.limit);
    const productIds = this.normalizeOptionalIds(options.productIds, 'productIds');
    const warehouseIds = this.normalizeOptionalIds(options.warehouseIds, 'warehouseIds');
    const includeKnown = options.includeKnown === true;
    const summaries = productIds.length > 0
      ? await this.getRequestedProductSummaries(productIds, warehouseIds)
      : await this.getStockProductSummaries(warehouseIds, limit);
    const checkedProductIds = summaries.map((summary) => summary.productId);
    const catalogResults = await this.fetchCatalogIdentities(checkedProductIds);
    const unknownProducts: CatalogProductReconciliationItem[] = [];
    const catalogUnavailableProducts: CatalogProductReconciliationItem[] = [];
    const knownProducts: CatalogProductReconciliationItem[] = [];

    for (const summary of summaries) {
      const catalogResult = catalogResults.get(summary.productId);
      const item: CatalogProductReconciliationItem = {
        ...summary,
        status: catalogResult?.status ?? 'catalog_unavailable',
      };

      if (catalogResult?.status === 'known') {
        item.catalog = catalogResult.identity;
        knownProducts.push(item);
      } else if (catalogResult?.status === 'unknown') {
        item.catalogStatus = catalogResult.catalogStatus;
        unknownProducts.push(item);
      } else {
        item.catalogStatus = catalogResult?.catalogStatus;
        item.catalogError = catalogResult?.error ?? 'Catalog product identity lookup failed';
        catalogUnavailableProducts.push(item);
      }
    }

    await this.attachStockRows([...unknownProducts, ...catalogUnavailableProducts], warehouseIds);

    return {
      generatedAt: new Date().toISOString(),
      catalogBaseUrl: this.catalogBaseUrl(),
      source: 'catalog-product-read',
      requestedProductIds: productIds,
      checkedProductIds,
      filters: {
        warehouseIds,
        limit,
        includeKnown,
      },
      totals: {
        stockRows: summaries.reduce((total, summary) => total + summary.stockRowCount, 0),
        uniqueProductIds: summaries.length,
        knownProductIds: knownProducts.length,
        unknownProductIds: unknownProducts.length,
        catalogUnavailableProductIds: catalogUnavailableProducts.length,
        totalQuantity: summaries.reduce((total, summary) => total + summary.totalQuantity, 0),
        totalReserved: summaries.reduce((total, summary) => total + summary.totalReserved, 0),
        totalAvailable: summaries.reduce((total, summary) => total + summary.totalAvailable, 0),
      },
      unknownProducts,
      catalogUnavailableProducts,
      ...(includeKnown ? { knownProducts } : {}),
    };
  }

  private async getStockProductSummaries(
    warehouseIds: string[],
    limit: number,
  ): Promise<CatalogProductStockSummary[]> {
    const query = this.stockRepository
      .createQueryBuilder('stock')
      .select('stock.productId', 'productId')
      .addSelect('COUNT(*)', 'stockRowCount')
      .addSelect('COALESCE(SUM(stock.quantity), 0)', 'totalQuantity')
      .addSelect('COALESCE(SUM(stock.reserved), 0)', 'totalReserved')
      .addSelect('COALESCE(SUM(stock.available), 0)', 'totalAvailable')
      .groupBy('stock.productId')
      .orderBy('stock.productId', 'ASC')
      .limit(limit);

    if (warehouseIds.length > 0) {
      query.where('stock.warehouseId IN (:...warehouseIds)', { warehouseIds });
    }

    return this.toSummaries(await query.getRawMany());
  }

  private async getRequestedProductSummaries(
    productIds: string[],
    warehouseIds: string[],
  ): Promise<CatalogProductStockSummary[]> {
    const where: Record<string, unknown> = {
      productId: In(productIds),
    };

    if (warehouseIds.length > 0) {
      where.warehouseId = In(warehouseIds);
    }

    const stocks = await this.stockRepository.find({ where } as any);
    const summaries = new Map<string, CatalogProductStockSummary>();
    for (const productId of productIds) {
      summaries.set(productId, {
        productId,
        stockRowCount: 0,
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
      });
    }

    for (const stock of stocks) {
      const summary = summaries.get(stock.productId);
      if (!summary) continue;
      summary.stockRowCount += 1;
      summary.totalQuantity += Number(stock.quantity ?? 0);
      summary.totalReserved += Number(stock.reserved ?? 0);
      summary.totalAvailable += Number(stock.available ?? 0);
    }

    return productIds.map((productId) => summaries.get(productId)!);
  }

  private toSummaries(rows: Array<Record<string, unknown>>): CatalogProductStockSummary[] {
    return rows.map((row) => ({
      productId: String(row.productId),
      stockRowCount: Number(row.stockRowCount ?? 0),
      totalQuantity: Number(row.totalQuantity ?? 0),
      totalReserved: Number(row.totalReserved ?? 0),
      totalAvailable: Number(row.totalAvailable ?? 0),
    }));
  }

  private async fetchCatalogIdentities(productIds: string[]): Promise<Map<string, {
    status: 'known';
    identity: CatalogProductIdentity;
  } | {
    status: 'unknown';
    catalogStatus?: number;
  } | {
    status: 'catalog_unavailable';
    catalogStatus?: number;
    error: string;
  }>> {
    const results = new Map();
    for (const productId of productIds) {
      results.set(productId, await this.fetchCatalogIdentity(productId));
    }
    return results;
  }

  async searchProductsForAdmin(
    authorization: string | undefined,
    query: { search?: string; limit?: number | string },
  ): Promise<{
    items: Array<{ id: string; sku?: string; title?: string }>;
    pagination?: { total: number; page: number; limit: number; pages: number };
  }> {
    const limit = Math.min(Math.max(this.normalizeLimit(query.limit ?? 30), 1), 100);
    const params: Record<string, string> = {
      limit: String(limit),
      catalogScope: 'effective',
    };
    const search = String(query.search ?? '').trim();
    if (search) {
      params.search = search;
    }

    const payload = await this.catalogApiGet<{
      success?: boolean;
      data?: Array<{ id: string; sku?: string; title?: string }>;
      pagination?: { total: number; page: number; limit: number; pages: number };
    }>(authorization, 'products', params);

    if (payload.success !== true || !Array.isArray(payload.data)) {
      throw new HttpException('Catalog product search returned an invalid response', 502);
    }

    return {
      items: payload.data,
      pagination: payload.pagination,
    };
  }

  async getProductForAdmin(
    authorization: string | undefined,
    productId: string,
  ): Promise<{ id: string; sku?: string; title?: string }> {
    const payload = await this.catalogApiGet<{
      success?: boolean;
      data?: { id: string; sku?: string; title?: string };
    }>(authorization, `products/${encodeURIComponent(productId)}`);

    if (payload.success !== true || !payload.data?.id) {
      throw new HttpException('Catalog product lookup returned an invalid response', 502);
    }

    return payload.data;
  }

  private async fetchCatalogIdentity(productId: string): Promise<{
    status: 'known';
    identity: CatalogProductIdentity;
  } | {
    status: 'unknown';
    catalogStatus?: number;
  } | {
    status: 'catalog_unavailable';
    catalogStatus?: number;
    error: string;
  }> {
    const url = `${this.catalogBaseUrl()}/api/products/${encodeURIComponent(productId)}`;
    try {
      const response = await axios.get(url, {
        timeout: Number(process.env.CATALOG_PRODUCT_VALIDATION_TIMEOUT_MS || 5000),
      });
      const product = response.data?.data;
      if (!response.data?.success || !product?.id) {
        return {
          status: 'catalog_unavailable',
          catalogStatus: response.status,
          error: 'Catalog product response did not contain a product identity',
        };
      }
      return {
        status: 'known',
        identity: {
          productId: product.id,
          sku: product.sku ?? '',
          title: product.title ?? '',
        },
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      if (status === 400 || status === 404) {
        return { status: 'unknown', catalogStatus: status };
      }
      this.logger.warn(
        `Catalog product identity lookup failed for ${productId}${status ? ` with status ${status}` : ''}`,
        'CatalogProductReconciliationService',
      );
      return {
        status: 'catalog_unavailable',
        catalogStatus: status,
        error: axiosError.message || 'Catalog product identity lookup failed',
      };
    }
  }

  private async attachStockRows(
    items: CatalogProductReconciliationItem[],
    warehouseIds: string[],
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const productIds = items.map((item) => item.productId);
    const where: Record<string, unknown> = { productId: In(productIds) };
    if (warehouseIds.length > 0) {
      where.warehouseId = In(warehouseIds);
    }

    const stocks = await this.stockRepository.find({
      where,
      relations: ['warehouse'],
      order: {
        productId: 'ASC',
        warehouseId: 'ASC',
      },
    } as any);
    const rowsByProductId = new Map<string, CatalogProductReconciliationStockRow[]>();

    for (const stock of stocks) {
      const rows = rowsByProductId.get(stock.productId) ?? [];
      rows.push({
        warehouseId: stock.warehouseId,
        warehouseCode: stock.warehouse?.code ?? null,
        warehouseName: stock.warehouse?.name ?? null,
        warehouseType: stock.warehouse?.type ?? null,
        supplierId: stock.warehouse?.supplierId ?? null,
        quantity: stock.quantity,
        reserved: stock.reserved,
        available: stock.available,
      });
      rowsByProductId.set(stock.productId, rows);
    }

    for (const item of items) {
      item.stockRows = rowsByProductId.get(item.productId) ?? [];
    }
  }

  private normalizeOptionalIds(value: string[] | string | undefined, field: string): string[] {
    if (value === undefined || value === null || value === '') {
      return [];
    }

    const raw = Array.isArray(value) ? value : String(value).split(',');
    const normalized = raw.map((item) => String(item).trim()).filter(Boolean);
    const seen = new Set<string>();
    for (const item of normalized) {
      if (item.length > 200) {
        throw new BadRequestException(`${field} contains an identifier longer than 200 characters`);
      }
      if (seen.has(item)) {
        continue;
      }
      seen.add(item);
    }
    return [...seen];
  }

  private normalizeLimit(value?: number | string): number {
    const parsed = Number(value ?? this.defaultLimit);
    if (!Number.isFinite(parsed)) {
      return this.defaultLimit;
    }
    return Math.min(Math.max(Math.trunc(parsed), 1), this.maxLimit);
  }

  private catalogApiGet<T>(
    authorization: string | undefined,
    path: string,
    query?: Record<string, string>,
  ): Promise<T> {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    const normalizedPath = path.replace(/^\//, '');
    const url = `${this.catalogBaseUrl()}/api/${normalizedPath}${queryString}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (authorization) {
      headers.Authorization = authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`;
    }

    return axios
      .get<T>(url, {
        headers,
        timeout: Number(process.env.CATALOG_PRODUCT_VALIDATION_TIMEOUT_MS || 5000),
      })
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        const status = error.response?.status ?? 502;
        const body = error.response?.data as { message?: string | string[]; error?: string } | undefined;
        const rawMessage = body?.message ?? body?.error ?? error.message ?? 'Catalog request failed';
        const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
        throw new HttpException(message, status >= 400 && status < 600 ? status : 502);
      });
  }

  private catalogBaseUrl(): string {
    return (process.env.CATALOG_SERVICE_URL || 'http://catalog-microservice:3200').replace(/\/$/, '');
  }
}
