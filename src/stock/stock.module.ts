import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from './stock.entity';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { StockEventsService } from './stock-events.service';
import { LoggerModule } from '../logger/logger.module';
import { StockMovement } from '../movements/stock-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock, StockMovement]),
    LoggerModule,
  ],
  controllers: [StockController],
  providers: [StockService, StockEventsService],
  exports: [StockService, StockEventsService],
})
export class StockModule {}

