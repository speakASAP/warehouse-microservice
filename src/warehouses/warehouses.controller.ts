import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { BatchWarehouseLogisticsDto, UpdateWarehouseDto, WarehouseDto } from './dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';
import { Roles } from '../auth/roles.decorator';
import { WAREHOUSE_READ_ROLES, WAREHOUSE_ADMIN_ROLES } from '../auth/roles.constants';

@Controller('warehouses')
export class WarehousesController {
  constructor(
    private readonly warehousesService: WarehousesService,
    private readonly logger: LoggerService,
  ) {}

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get()
  async findAll() {
    this.logger.log('GET /api/warehouses', 'WarehousesController');
    const warehouses = await this.warehousesService.findAll();
    return { success: true, data: warehouses };
  }

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get('topology')
  async getInventoryTopology(@Query('productId') productId?: string) {
    this.logger.log('GET /api/warehouses/topology', 'WarehousesController');
    const topology = await this.warehousesService.getInventoryTopology(productId);
    return { success: true, data: topology };
  }

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get('logistics/:productId')
  async getProductLogistics(@Param('productId') productId: string) {
    this.logger.log('GET /api/warehouses/logistics/' + productId, 'WarehousesController');
    const logistics = await this.warehousesService.getProductLogistics(productId);
    return { success: true, data: logistics };
  }

  @Roles(...WAREHOUSE_READ_ROLES)
  @Post('logistics/batch')
  async getBatchProductLogistics(@Body() data: BatchWarehouseLogisticsDto) {
    this.logger.log('POST /api/warehouses/logistics/batch', 'WarehousesController');
    const logistics = await this.warehousesService.getBatchProductLogistics(data.productIds);
    return { success: true, data: logistics };
  }

  @Roles(...WAREHOUSE_READ_ROLES)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log('GET /api/warehouses/' + id, 'WarehousesController');
    const warehouse = await this.warehousesService.findOne(id);
    return { success: true, data: warehouse };
  }

  @Roles(...WAREHOUSE_ADMIN_ROLES)
  @Post()
  async create(@Body() data: WarehouseDto) {
    this.logger.log('POST /api/warehouses', 'WarehousesController');
    const warehouse = await this.warehousesService.create(data);
    return { success: true, data: warehouse };
  }

  @Roles(...WAREHOUSE_ADMIN_ROLES)
  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdateWarehouseDto) {
    this.logger.log('PUT /api/warehouses/' + id, 'WarehousesController');
    const warehouse = await this.warehousesService.update(id, data);
    return { success: true, data: warehouse };
  }

  @Roles(...WAREHOUSE_ADMIN_ROLES)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log('DELETE /api/warehouses/' + id, 'WarehousesController');
    await this.warehousesService.remove(id);
    return { success: true };
  }
}
