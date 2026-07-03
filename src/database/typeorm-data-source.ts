import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { StockMovement } from '../movements/stock-movement.entity';
import { StockReservation } from '../reservations/stock-reservation.entity';
import { StockEventOutbox } from '../stock/stock-event-outbox.entity';
import { Stock } from '../stock/stock.entity';
import { SupplierStockReconciliation } from '../suppliers/supplier-stock-reconciliation.entity';
import { Warehouse } from '../warehouses/warehouse.entity';
import { FulfillmentOrderLine } from '../fulfillment/fulfillment-order-line.entity';
import { FulfillmentOrder } from '../fulfillment/fulfillment-order.entity';
import { FulfillmentProviderStatusObservation } from '../fulfillment/fulfillment-provider-status-observation.entity';

config({ path: '.env' });

const isProduction = process.env.NODE_ENV === 'production';

export function createWarehouseTypeOrmOptions(): DataSourceOptions {
  const baseOptions: DataSourceOptions = {
    type: 'postgres',
    entities: [
      Warehouse,
      Stock,
      StockMovement,
      StockReservation,
      StockEventOutbox,
      SupplierStockReconciliation,
      FulfillmentOrder,
      FulfillmentOrderLine,
      FulfillmentProviderStatusObservation,
    ],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsTableName: 'warehouse_migrations',
    synchronize: process.env.DB_SYNC === 'true' && !isProduction,
    logging: process.env.DB_LOGGING === 'true' || !isProduction,
  };

  if (process.env.DATABASE_URL) {
    return {
      ...baseOptions,
      url: process.env.DATABASE_URL,
    };
  }

  return {
    ...baseOptions,
    host: process.env.DB_HOST || 'db-server-postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'dbadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'warehouse_db',
  };
}

export default new DataSource(createWarehouseTypeOrmOptions());
