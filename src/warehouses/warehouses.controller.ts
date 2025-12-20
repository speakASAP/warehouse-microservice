import { Controller, Get, Post, Put, Delete, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { Warehouse } from './warehouse.entity';
import { LoggerService } from '../logger/logger.service';

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

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`GET /api/warehouses/${id}`, 'WarehousesController');
    const warehouse = await this.warehousesService.findOne(id);
    return { success: true, data: warehouse };
  }

  @Post()
  async create(@Body() data: Partial<Warehouse>) {
    this.logger.log('POST /api/warehouses', 'WarehousesController');
    const warehouse = await this.warehousesService.create(data);
    return { success: true, data: warehouse };
  }

  @Put(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() data: Partial<Warehouse>) {
    this.logger.log(`PUT /api/warehouses/${id}`, 'WarehousesController');
    const warehouse = await this.warehousesService.update(id, data);
    return { success: true, data: warehouse };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`DELETE /api/warehouses/${id}`, 'WarehousesController');
    await this.warehousesService.remove(id);
    return { success: true };
  }
}

