import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from './stock/stock.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { MovementsModule } from './movements/movements.module';
import { ReservationsModule } from './reservations/reservations.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { JwtRolesGuard } from './auth/jwt-roles.guard';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ObservabilityModule } from './observability/observability.module';
import { createWarehouseTypeOrmOptions } from './database/typeorm-data-source';

/**
 * Main application module for Warehouse Microservice
 * Tracks stock levels and publishes real-time updates via RabbitMQ
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    ObservabilityModule,
    TypeOrmModule.forRoot(createWarehouseTypeOrmOptions()),

    LoggerModule,
    HealthModule,
    WarehousesModule,
    StockModule,
    MovementsModule,
    ReservationsModule,
    SuppliersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtRolesGuard },
  ],
})
export class AppModule {}
