import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockReservation } from './stock-reservation.entity';
import { LoggerService } from '../logger/logger.service';
import { Stock } from '../stock/stock.entity';
import { ReservationLifecycleDto, ReserveStockDto, UnreserveStockDto } from '../stock/dto/stock-mutation.dto';
import { StockService } from '../stock/stock.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(StockReservation)
    private readonly reservationRepository: Repository<StockReservation>,
    private readonly stockService: StockService,
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

  async reserve(body: ReserveStockDto): Promise<Stock> {
    return this.stockService.reserveStock(body.productId, body.warehouseId, body.quantity, body.orderId, {
      reasonCode: body.reasonCode,
      actor: body.actor,
      reference: body.reference,
    }, {
      channel: body.channel,
      expiresAt: body.expiresAt,
    });
  }

  async release(body: UnreserveStockDto): Promise<Stock> {
    return this.stockService.unreserveStock(body.productId, body.warehouseId, body.quantity, body.orderId, {
      reasonCode: body.reasonCode,
      actor: body.actor,
      reference: body.reference,
    }, body.channel);
  }

  async fulfill(body: ReservationLifecycleDto): Promise<Stock> {
    return this.stockService.fulfillReservation(body.productId, body.warehouseId, body.orderId, {
      reasonCode: body.reasonCode,
      actor: body.actor,
      reference: body.reference,
    }, body.channel);
  }

  async cancel(body: ReservationLifecycleDto): Promise<Stock> {
    return this.stockService.cancelReservation(body.productId, body.warehouseId, body.orderId, {
      reasonCode: body.reasonCode,
      actor: body.actor,
      reference: body.reference,
    }, body.channel);
  }

  async expire(body: ReservationLifecycleDto): Promise<Stock> {
    return this.stockService.expireReservation(body.productId, body.warehouseId, body.orderId, {
      reasonCode: body.reasonCode,
      actor: body.actor,
      reference: body.reference,
    }, body.channel);
  }

  async returnReservation(body: ReservationLifecycleDto): Promise<Stock> {
    return this.stockService.returnReservation(body.productId, body.warehouseId, body.orderId, {
      reasonCode: body.reasonCode,
      actor: body.actor,
      reference: body.reference,
    }, body.channel);
  }
}
