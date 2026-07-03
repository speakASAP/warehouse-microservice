import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import { StockReservation } from '../reservations/stock-reservation.entity';
import { FulfillmentOrderLine } from './fulfillment-order-line.entity';
import { FulfillmentOrder } from './fulfillment-order.entity';
import { FulfillmentProviderStatusObservation } from './fulfillment-provider-status-observation.entity';
import { FulfillmentProviderStatusLedgerService } from './fulfillment-provider-status-ledger.service';
import { FulfillmentProviderStatusSnapshotAdapterService } from './fulfillment-provider-status-snapshot-adapter.service';
import { FulfillmentOrdersController } from './fulfillment-orders.controller';
import { FulfillmentOrdersService } from './fulfillment-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FulfillmentOrder, FulfillmentOrderLine, FulfillmentProviderStatusObservation, StockReservation]),
    LoggerModule,
  ],
  controllers: [FulfillmentOrdersController],
  providers: [FulfillmentOrdersService, FulfillmentProviderStatusLedgerService, FulfillmentProviderStatusSnapshotAdapterService],
  exports: [FulfillmentOrdersService, FulfillmentProviderStatusLedgerService, FulfillmentProviderStatusSnapshotAdapterService],
})
export class FulfillmentModule {}
