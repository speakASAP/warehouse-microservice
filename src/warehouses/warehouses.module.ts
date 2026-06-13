import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from '../stock/stock.entity';
import { LoggerModule } from '../logger/logger.module';
import { Warehouse } from './warehouse.entity';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse, Stock]), LoggerModule],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
