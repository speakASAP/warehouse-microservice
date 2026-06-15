import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { StockReservation } from './stock-reservation.entity';
import { LoggerService } from '../logger/logger.service';
import { Stock } from '../stock/stock.entity';
import { ExpireDueReservationsDto, ReservationLifecycleDto, ReserveStockDto, UnreserveStockDto } from '../stock/dto/stock-mutation.dto';
import { StockService } from '../stock/stock.service';

const RESERVATION_EXPIRY_ACTOR = 'warehouse-reservation-expiry-cron';
const RESERVATION_EXPIRY_REASON = 'RESERVATION_TTL_EXPIRED';
const DEFAULT_EXPIRY_BATCH_LIMIT = 100;

export interface ExpireDueReservationResult {
  reservationId: string;
  productId: string;
  warehouseId: string;
  orderId: string;
  channel: string;
  status: 'expired' | 'failed';
  error?: string;
}

export interface ExpireDueReservationsSummary {
  cutoff: string;
  examined: number;
  expired: number;
  failed: number;
  results: ExpireDueReservationResult[];
}

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

  async expireDueReservations(
    body: ExpireDueReservationsDto = {},
    now = new Date(),
  ): Promise<ExpireDueReservationsSummary> {
    const limit = body.limit ?? DEFAULT_EXPIRY_BATCH_LIMIT;
    const dueReservations = await this.reservationRepository.find({
      where: {
        status: 'active',
        expiresAt: LessThanOrEqual(now),
      },
      order: { expiresAt: 'ASC', createdAt: 'ASC' },
      take: limit,
    });

    const results: ExpireDueReservationResult[] = [];
    for (const reservation of dueReservations) {
      try {
        await this.stockService.expireReservation(
          reservation.productId,
          reservation.warehouseId,
          reservation.orderId,
          {
            reasonCode: RESERVATION_EXPIRY_REASON,
            actor: RESERVATION_EXPIRY_ACTOR,
            reference: reservation.id,
          },
          reservation.channel,
          now,
        );
        results.push(this.toExpireResult(reservation, 'expired'));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown reservation expiry failure';
        this.logger.error(
          `reservation_expiry status=failed reservationId=${reservation.id} productId=${reservation.productId} warehouseId=${reservation.warehouseId} orderId=${reservation.orderId} error=${message}`,
          '',
          'ReservationsService',
        );
        results.push(this.toExpireResult(reservation, 'failed', message));
      }
    }

    const failed = results.filter((result) => result.status === 'failed').length;
    const expired = results.filter((result) => result.status === 'expired').length;

    this.logger.log(
      `reservation_expiry_batch status=completed cutoff=${now.toISOString()} examined=${dueReservations.length} expired=${expired} failed=${failed}`,
      'ReservationsService',
    );

    return {
      cutoff: now.toISOString(),
      examined: dueReservations.length,
      expired,
      failed,
      results,
    };
  }

  private toExpireResult(
    reservation: StockReservation,
    status: ExpireDueReservationResult['status'],
    error?: string,
  ): ExpireDueReservationResult {
    return {
      reservationId: reservation.id,
      productId: reservation.productId,
      warehouseId: reservation.warehouseId,
      orderId: reservation.orderId,
      channel: reservation.channel,
      status,
      ...(error ? { error } : {}),
    };
  }
}
