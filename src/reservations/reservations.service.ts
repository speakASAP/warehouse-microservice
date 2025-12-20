import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockReservation } from './stock-reservation.entity';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(StockReservation)
    private readonly reservationRepository: Repository<StockReservation>,
    private readonly logger: LoggerService,
  ) {}

  async findByOrder(orderId: string): Promise<StockReservation[]> {
    return this.reservationRepository.find({
      where: { orderId },
      relations: ['warehouse'],
    });
  }

  async findByProduct(productId: string): Promise<StockReservation[]> {
    return this.reservationRepository.find({
      where: { productId, status: 'active' },
      relations: ['warehouse'],
    });
  }

  async findActive(): Promise<StockReservation[]> {
    return this.reservationRepository.find({
      where: { status: 'active' },
      relations: ['warehouse'],
      order: { createdAt: 'DESC' },
    });
  }
}

