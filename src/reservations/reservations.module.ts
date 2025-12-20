import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockReservation } from './stock-reservation.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([StockReservation]), LoggerModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}

