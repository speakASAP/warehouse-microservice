import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { getAuthenticatedMutationActor } from '../auth/authenticated-actor';
import { StockService } from './stock.service';
import { LoggerService } from '../logger/logger.service';
import { CatalogProductReconciliationService } from './catalog-product-reconciliation.service';
import {
  BatchAvailabilityDto,
  PositiveStockMutationDto,
  ReserveStockDto,
  SetStockDto,
  UnreserveStockDto,
} from './dto/stock-mutation.dto';

@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly logger: LoggerService,
    private readonly catalogProductReconciliation?: CatalogProductReconciliationService,
  ) {}

  /**
   * Report warehouse stock rows whose productId no longer resolves in catalog.
   * GET /api/stock/catalog/reconciliation
   */
  @Get('catalog/reconciliation')
  async getCatalogReconciliation(@Query() query: {
    productIds?: string | string[];
    warehouseIds?: string | string[];
    limit?: number | string;
    includeKnown?: boolean | string;
  }) {
    this.logger.log('GET /api/stock/catalog/reconciliation', 'StockController');
    if (!this.catalogProductReconciliation) {
      throw new Error('Catalog product reconciliation service is not configured');
    }
    const report = await this.catalogProductReconciliation.getReport({
      productIds: query.productIds,
      warehouseIds: query.warehouseIds,
      limit: query.limit,
      includeKnown: query.includeKnown === true || query.includeKnown === 'true',
    });
    return { success: true, data: report };
  }

  /**
   * Get stock for a product across all warehouses
   * GET /api/stock/:productId
   */
  @Get(':productId')
  async getStockByProduct(@Param('productId') productId: string) {
    this.logger.log(`GET /api/stock/${productId}`, 'StockController');
    const stock = await this.stockService.getStockByProduct(productId);
    return { success: true, data: stock };
  }

  /**
   * Get total available stock for a product
   * GET /api/stock/:productId/total
   */
  @Get(':productId/total')
  async getTotalAvailable(@Param('productId') productId: string) {
    this.logger.log(`GET /api/stock/${productId}/total`, 'StockController');
    const total = await this.stockService.getTotalAvailable(productId);
    return { success: true, data: { productId, totalAvailable: total } };
  }

  /**
   * Get availability for multiple products
   * POST /api/stock/availability/batch
   */
  @Post('availability/batch')
  async getBatchAvailability(@Body() body: BatchAvailabilityDto) {
    this.logger.log('POST /api/stock/availability/batch', 'StockController');
    const availability = await this.stockService.getBatchAvailability(body.productIds, body.warehouseIds);
    return { success: true, data: availability };
  }

  /**
   * Set stock quantity
   * POST /api/stock/set
   */
  @Post('set')
  async setStock(@Body() body: SetStockDto, @Req() request: Request) {
    this.logger.log(`POST /api/stock/set`, 'StockController');
    const stock = await this.stockService.setStock(body.productId, body.warehouseId, body.quantity, {
      reasonCode: body.reasonCode,
      actor: getAuthenticatedMutationActor(request),
      reference: body.reference,
    });
    return { success: true, data: stock };
  }

  /**
   * Increment stock
   * POST /api/stock/increment
   */
  @Post('increment')
  async incrementStock(@Body() body: PositiveStockMutationDto, @Req() request: Request) {
    this.logger.log(`POST /api/stock/increment`, 'StockController');
    const stock = await this.stockService.incrementStock(body.productId, body.warehouseId, body.quantity, {
      reasonCode: body.reasonCode,
      actor: getAuthenticatedMutationActor(request),
      reference: body.reference,
    });
    return { success: true, data: stock };
  }

  /**
   * Decrement stock
   * POST /api/stock/decrement
   */
  @Post('decrement')
  async decrementStock(@Body() body: PositiveStockMutationDto, @Req() request: Request) {
    this.logger.log(`POST /api/stock/decrement`, 'StockController');
    const stock = await this.stockService.decrementStock(body.productId, body.warehouseId, body.quantity, {
      reasonCode: body.reasonCode,
      actor: getAuthenticatedMutationActor(request),
      reference: body.reference,
    });
    return { success: true, data: stock };
  }

  /**
   * Reserve stock for order
   * POST /api/stock/reserve
   */
  @Post('reserve')
  async reserveStock(@Body() body: ReserveStockDto, @Req() request: Request) {
    this.logger.log(`POST /api/stock/reserve`, 'StockController');
    const stock = await this.stockService.reserveStock(body.productId, body.warehouseId, body.quantity, body.orderId, {
      reasonCode: body.reasonCode,
      actor: getAuthenticatedMutationActor(request),
      reference: body.reference,
    }, {
      channel: body.channel,
      expiresAt: body.expiresAt,
    });
    return { success: true, data: stock };
  }

  /**
   * Release reserved stock
   * POST /api/stock/unreserve
   */
  @Post('unreserve')
  async unreserveStock(@Body() body: UnreserveStockDto, @Req() request: Request) {
    this.logger.log(`POST /api/stock/unreserve`, 'StockController');
    const stock = await this.stockService.unreserveStock(body.productId, body.warehouseId, body.quantity, body.orderId, {
      reasonCode: body.reasonCode,
      actor: getAuthenticatedMutationActor(request),
      reference: body.reference,
    }, body.channel);
    return { success: true, data: stock };
  }
}
