import { Controller, Get, Param, Query } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { LoggerService } from '../logger/logger.service';
import { Roles } from '../auth/roles.decorator';
import { WAREHOUSE_READ_ROLES } from '../auth/roles.constants';

@Controller('movements')
export class MovementsController {
  constructor(
    private readonly movementsService: MovementsService,
    private readonly logger: LoggerService,
  ) {}

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get('product/:productId')
  async findByProduct(@Param('productId') productId: string, @Query('limit') limit?: number) {
    this.logger.log(`GET /api/movements/product/${productId}`, 'MovementsController');
    const movements = await this.movementsService.findByProduct(productId, limit);
    return { success: true, data: movements };
  }

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get('warehouse/:warehouseId')
  async findByWarehouse(@Param('warehouseId') warehouseId: string, @Query('limit') limit?: number) {
    this.logger.log(`GET /api/movements/warehouse/${warehouseId}`, 'MovementsController');
    const movements = await this.movementsService.findByWarehouse(warehouseId, limit);
    return { success: true, data: movements };
  }
}

