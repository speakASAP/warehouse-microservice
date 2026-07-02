import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import { StockReservation } from '../reservations/stock-reservation.entity';
import { FulfillmentOrderLine } from './fulfillment-order-line.entity';
import { FulfillmentOrder } from './fulfillment-order.entity';
import { FulfillmentOrdersController } from './fulfillment-orders.controller';
import { FulfillmentOrdersService } from './fulfillment-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FulfillmentOrder, FulfillmentOrderLine, StockReservation]),
    LoggerModule,
  ],
  controllers: [FulfillmentOrdersController],
  providers: [FulfillmentOrdersService],
  exports: [FulfillmentOrdersService],
})
export class FulfillmentModule {}
