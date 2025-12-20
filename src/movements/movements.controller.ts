import { Controller, Get, Param, Query } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { LoggerService } from '../logger/logger.service';

@Controller('movements')
export class MovementsController {
  constructor(
    private readonly movementsService: MovementsService,
    private readonly logger: LoggerService,
  ) {}

  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string, @Query('limit') limit?: number) {
    this.logger.log(`GET /api/movements/product/${productId}`, 'MovementsController');
    const movements = await this.movementsService.findByProduct(productId, limit);
    return { success: true, data: movements };
  }

  @Get('warehouse/:warehouseId')
  async findByWarehouse(@Param('warehouseId') warehouseId: string, @Query('limit') limit?: number) {
    this.logger.log(`GET /api/movements/warehouse/${warehouseId}`, 'MovementsController');
    const movements = await this.movementsService.findByWarehouse(warehouseId, limit);
    return { success: true, data: movements };
  }
}

