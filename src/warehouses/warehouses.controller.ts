import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { BatchWarehouseLogisticsDto, UpdateWarehouseDto, WarehouseDto } from './dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';

@Controller('warehouses')
export class WarehousesController {
  constructor(
    private readonly warehousesService: WarehousesService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  async findAll() {
    this.logger.log('GET /api/warehouses', 'WarehousesController');
    const warehouses = await this.warehousesService.findAll();
    return { success: true, data: warehouses };
  }

  @Get('topology')
  async getInventoryTopology(@Query('productId') productId?: string) {
    this.logger.log('GET /api/warehouses/topology', 'WarehousesController');
    const topology = await this.warehousesService.getInventoryTopology(productId);
    return { success: true, data: topology };
  }

  @Get('logistics/:productId')
  async getProductLogistics(@Param('productId') productId: string) {
    this.logger.log('GET /api/warehouses/logistics/' + productId, 'WarehousesController');
    const logistics = await this.warehousesService.getProductLogistics(productId);
    return { success: true, data: logistics };
  }

  @Post('logistics/batch')
  async getBatchProductLogistics(@Body() data: BatchWarehouseLogisticsDto) {
    this.logger.log('POST /api/warehouses/logistics/batch', 'WarehousesController');
    const logistics = await this.warehousesService.getBatchProductLogistics(data.productIds);
    return { success: true, data: logistics };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log('GET /api/warehouses/' + id, 'WarehousesController');
    const warehouse = await this.warehousesService.findOne(id);
    return { success: true, data: warehouse };
  }

  @Post()
  async create(@Body() data: WarehouseDto) {
    this.logger.log('POST /api/warehouses', 'WarehousesController');
    const warehouse = await this.warehousesService.create(data);
    return { success: true, data: warehouse };
  }

  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: UpdateWarehouseDto) {
    this.logger.log('PUT /api/warehouses/' + id, 'WarehousesController');
    const warehouse = await this.warehousesService.update(id, data);
    return { success: true, data: warehouse };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log('DELETE /api/warehouses/' + id, 'WarehousesController');
    await this.warehousesService.remove(id);
    return { success: true };
  }
}
