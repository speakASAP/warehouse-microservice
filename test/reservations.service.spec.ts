import 'reflect-metadata';
import { StockReservation } from '../src/reservations/stock-reservation.entity';
import { ReservationsService } from '../src/reservations/reservations.service';

describe('ReservationsService automatic expiry', () => {
  function createService(reservations: Partial<StockReservation>[], expireReservation = jest.fn().mockResolvedValue({})) {
    const reservationRepository = {
      find: jest.fn().mockResolvedValue(reservations),
    };
    const stockService = {
      expireReservation,
    };
    const logger = {
      log: jest.fn(),
      error: jest.fn(),
    };

    return {
      service: new ReservationsService(reservationRepository as any, stockService as any, logger as any),
      reservationRepository,
      stockService,
      logger,
    };
  }

  it('expires active reservations whose TTL is due using the worker audit context', async () => {
    const now = new Date('2026-06-13T10:00:00.000Z');
    const reservation: Partial<StockReservation> = {
      id: 'reservation-1',
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      channel: 'flipflop',
      quantity: 2,
      status: 'active',
      expiresAt: new Date('2026-06-13T09:59:00.000Z'),
    };
    const { service, reservationRepository, stockService } = createService([reservation]);

    const summary = await service.expireDueReservations({ limit: 50 }, now);

    expect(reservationRepository.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'active',
        expiresAt: expect.any(Object),
      }),
      order: { expiresAt: 'ASC', createdAt: 'ASC' },
      take: 50,
    }));
    expect(stockService.expireReservation).toHaveBeenCalledWith(
      'product-1',
      'warehouse-1',
      'order-1',
      {
        reasonCode: 'RESERVATION_TTL_EXPIRED',
        actor: 'warehouse-reservation-expiry-cron',
        reference: 'reservation-1',
      },
      'flipflop',
      now,
    );
    expect(summary).toEqual({
      cutoff: '2026-06-13T10:00:00.000Z',
      examined: 1,
      expired: 1,
      failed: 0,
      results: [
        {
          reservationId: 'reservation-1',
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          orderId: 'order-1',
          channel: 'flipflop',
          status: 'expired',
        },
      ],
    });
  });

  it('continues through per-reservation failures and reports them for CronJob observability', async () => {
    const now = new Date('2026-06-13T10:00:00.000Z');
    const expireReservation = jest
      .fn()
      .mockRejectedValueOnce(new Error('reserved stock drift'))
      .mockResolvedValueOnce({});
    const { service, logger } = createService([
      {
        id: 'reservation-1',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        orderId: 'order-1',
        channel: 'flipflop',
        status: 'active',
      },
      {
        id: 'reservation-2',
        productId: 'product-2',
        warehouseId: 'warehouse-1',
        orderId: 'order-2',
        channel: 'flipflop',
        status: 'active',
      },
    ], expireReservation);

    const summary = await service.expireDueReservations({}, now);

    expect(summary.expired).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.results[0]).toEqual(expect.objectContaining({
      reservationId: 'reservation-1',
      status: 'failed',
      error: 'reserved stock drift',
    }));
    expect(expireReservation).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('reservation_expiry status=failed'),
      '',
      'ReservationsService',
    );
  });
});
