import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { StockService } from './stock.service';
import { LoggerService } from '../logger/logger.service';

@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly logger: LoggerService,
  ) {}

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
   * Set stock quantity
   * POST /api/stock/set
   */
  @Post('set')
  async setStock(@Body() body: { productId: string; warehouseId: string; quantity: number; reason?: string }) {
    this.logger.log(`POST /api/stock/set`, 'StockController');
    const stock = await this.stockService.setStock(body.productId, body.warehouseId, body.quantity, body.reason);
    return { success: true, data: stock };
  }

  /**
   * Increment stock
   * POST /api/stock/increment
   */
  @Post('increment')
  async incrementStock(@Body() body: { productId: string; warehouseId: string; quantity: number; reason?: string }) {
    this.logger.log(`POST /api/stock/increment`, 'StockController');
    const stock = await this.stockService.incrementStock(body.productId, body.warehouseId, body.quantity, body.reason);
    return { success: true, data: stock };
  }

  /**
   * Decrement stock
   * POST /api/stock/decrement
   */
  @Post('decrement')
  async decrementStock(@Body() body: { productId: string; warehouseId: string; quantity: number; reason?: string }) {
    this.logger.log(`POST /api/stock/decrement`, 'StockController');
    const stock = await this.stockService.decrementStock(body.productId, body.warehouseId, body.quantity, body.reason);
    return { success: true, data: stock };
  }

  /**
   * Reserve stock for order
   * POST /api/stock/reserve
   */
  @Post('reserve')
  async reserveStock(@Body() body: { productId: string; warehouseId: string; quantity: number; orderId: string }) {
    this.logger.log(`POST /api/stock/reserve`, 'StockController');
    const stock = await this.stockService.reserveStock(body.productId, body.warehouseId, body.quantity, body.orderId);
    return { success: true, data: stock };
  }

  /**
   * Release reserved stock
   * POST /api/stock/unreserve
   */
  @Post('unreserve')
  async unreserveStock(@Body() body: { productId: string; warehouseId: string; quantity: number; orderId: string }) {
    this.logger.log(`POST /api/stock/unreserve`, 'StockController');
    const stock = await this.stockService.unreserveStock(body.productId, body.warehouseId, body.quantity, body.orderId);
    return { success: true, data: stock };
  }
}

