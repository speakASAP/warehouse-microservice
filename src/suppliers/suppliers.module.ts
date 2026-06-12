import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from '../logger/logger.module';
import { StockModule } from '../stock/stock.module';
import { SupplierReconciliationController } from './supplier-reconciliation.controller';
import { SupplierReconciliationService } from './supplier-reconciliation.service';
import { SupplierStockReconciliation } from './supplier-stock-reconciliation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupplierStockReconciliation]),
    LoggerModule,
    StockModule,
  ],
  controllers: [SupplierReconciliationController],
  providers: [SupplierReconciliationService],
})
export class SuppliersModule {}
