import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { StockReservation } from '../src/reservations/stock-reservation.entity';
import { Stock } from '../src/stock/stock.entity';
import { StockService, StockMutationContext } from '../src/stock/stock.service';

describe('StockService mutation invariants', () => {
  const context: StockMutationContext = {
    reasonCode: 'ORDER_FULFILLED',
    actor: 'orders-microservice',
  };

  function createService(existingStock?: Partial<Stock>, reservations: Partial<StockReservation>[] = []) {
    const stockRepository = {
      find: jest.fn(),
      findOne: jest.fn().mockResolvedValue(existingStock ?? null),
      createQueryBuilder: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (stock) => stock),
    };

    const movementRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(async (movement) => movement),
    };

    const matchesStatus = (reservation: Partial<StockReservation>, statusCriteria: any) => {
      if (typeof statusCriteria === 'string') {
        return reservation.status === statusCriteria;
      }

      const statusValues = statusCriteria?._value ?? statusCriteria?.value;
      return Array.isArray(statusValues) && statusValues.includes(reservation.status);
    };

    const reservationRepository = {
      findOne: jest.fn(async ({ where }) => reservations.find((reservation) => (
        reservation.productId === where.productId &&
        reservation.warehouseId === where.warehouseId &&
        reservation.orderId === where.orderId &&
        (!where.channel || reservation.channel === where.channel) &&
        matchesStatus(reservation, where.status)
      )) ?? null),
      create: jest.fn((data) => data),
      save: jest.fn(async (reservation) => reservation),
    };

    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Stock) return stockRepository;
        if (entity === StockReservation) return reservationRepository;
        return movementRepository;
      }),
    };

    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };

    const stockEvents = {
      publishStockUpdated: jest.fn().mockResolvedValue(undefined),
      publishStockLow: jest.fn().mockResolvedValue(undefined),
      publishStockOut: jest.fn().mockResolvedValue(undefined),
    };

    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    return {
      service: new StockService(stockRepository as any, dataSource as any, stockEvents as any, logger as any),
      stockRepository,
      movementRepository,
      reservationRepository,
      dataSource,
      stockEvents,
    };
  }

  it('rejects a missing reason code before opening a transaction', async () => {
    const { service, dataSource } = createService();

    await expect(
      service.incrementStock('product-1', 'warehouse-1', 1, {
        reasonCode: '',
        actor: 'operator-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects negative stock input before opening a transaction', async () => {
    const { service, dataSource } = createService();

    await expect(service.setStock('product-1', 'warehouse-1', -1, context)).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects insufficient stock without saving stock or movement rows', async () => {
    const { service, stockRepository, movementRepository } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 5,
      reserved: 3,
      available: 2,
      lowStockThreshold: 5,
    });

    await expect(service.decrementStock('product-1', 'warehouse-1', 3, context)).rejects.toBeInstanceOf(BadRequestException);

    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(movementRepository.save).not.toHaveBeenCalled();
  });

  it('locks the stock row and writes stock plus movement in the same transaction', async () => {
    const { service, stockRepository, movementRepository, dataSource, stockEvents } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reserved: 0,
      available: 10,
      lowStockThreshold: 5,
    });

    await service.decrementStock('product-1', 'warehouse-1', 4, context);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(stockRepository.findOne).toHaveBeenCalledWith({
      where: { productId: 'product-1', warehouseId: 'warehouse-1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(stockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        quantity: 6,
        reserved: 0,
        available: 6,
      }),
    );
    expect(movementRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'product-1',
        type: 'out',
        quantity: -4,
        fromWarehouseId: 'warehouse-1',
        reason: 'ORDER_FULFILLED',
        createdBy: 'orders-microservice',
      }),
    );
    expect(stockEvents.publishStockUpdated).toHaveBeenCalledWith('product-1', 'warehouse-1', 6, 6);
  });

  it('creates a reservation row and increases reserved stock on checkout hold', async () => {
    const { service, stockRepository, reservationRepository, movementRepository } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reserved: 1,
      available: 9,
      lowStockThreshold: 5,
    });

    await service.reserveStock('product-1', 'warehouse-1', 3, 'order-1', context, {
      channel: 'flipflop',
      expiresAt: '2026-06-12T10:00:00.000Z',
    });

    expect(stockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      reserved: 4,
      available: 6,
    }));
    expect(reservationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      channel: 'flipflop',
      quantity: 3,
      status: 'active',
    }));
    expect(movementRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      type: 'reserve',
      quantity: 3,
      reference: 'order-1',
    }));
  });

  it('does not double-count reserved stock when a reservation webhook is replayed', async () => {
    const reservation: Partial<StockReservation> = {
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      channel: 'flipflop',
      quantity: 3,
      status: 'active',
    };
    const { service, stockRepository, reservationRepository, movementRepository } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reserved: 3,
      available: 7,
      lowStockThreshold: 5,
    }, [reservation]);

    await service.reserveStock('product-1', 'warehouse-1', 3, 'order-1', context, {
      channel: 'flipflop',
      expiresAt: '2026-06-12T10:00:00.000Z',
    });

    expect(stockRepository.save).not.toHaveBeenCalled();
    expect(reservationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 3,
      status: 'active',
    }));
    expect(movementRepository.save).not.toHaveBeenCalled();
  });

  it('releases reserved stock on payment failure', async () => {
    const reservation: Partial<StockReservation> = {
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      channel: 'flipflop',
      quantity: 3,
      status: 'active',
    };
    const { service, stockRepository, reservationRepository } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reserved: 3,
      available: 7,
      lowStockThreshold: 5,
    }, [reservation]);

    await service.unreserveStock('product-1', 'warehouse-1', 3, 'order-1', context, 'flipflop');

    expect(stockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      reserved: 0,
      available: 10,
    }));
    expect(reservationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'released',
    }));
  });

  it('deducts stock and clears the hold on payment success', async () => {
    const reservation: Partial<StockReservation> = {
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      channel: 'flipflop',
      quantity: 3,
      status: 'active',
    };
    const { service, stockRepository, reservationRepository, movementRepository } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reserved: 3,
      available: 7,
      lowStockThreshold: 5,
    }, [reservation]);

    await service.fulfillReservation('product-1', 'warehouse-1', 'order-1', context, 'flipflop');

    expect(stockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 7,
      reserved: 0,
      available: 7,
    }));
    expect(reservationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'fulfilled',
    }));
    expect(movementRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      type: 'fulfill',
      quantity: -3,
      fromWarehouseId: 'warehouse-1',
    }));
  });

  it('expires a timed-out reservation and releases reserved stock', async () => {
    const reservation: Partial<StockReservation> = {
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      channel: 'flipflop',
      quantity: 3,
      status: 'active',
      expiresAt: new Date('2026-06-12T10:00:00.000Z'),
    };
    const { service, stockRepository, reservationRepository } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 10,
      reserved: 3,
      available: 7,
      lowStockThreshold: 5,
    }, [reservation]);

    await service.expireReservation('product-1', 'warehouse-1', 'order-1', context, 'flipflop', new Date('2026-06-12T10:01:00.000Z'));

    expect(stockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      reserved: 0,
      available: 10,
    }));
    expect(reservationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'expired',
    }));
  });

  it('restocks a fulfilled reservation when an order cancellation is reversed', async () => {
    const reservation: Partial<StockReservation> = {
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      channel: 'flipflop',
      quantity: 3,
      status: 'fulfilled',
    };
    const { service, stockRepository, reservationRepository } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 7,
      reserved: 0,
      available: 7,
      lowStockThreshold: 5,
    }, [reservation]);

    await service.cancelReservation('product-1', 'warehouse-1', 'order-1', context, 'flipflop');

    expect(stockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 10,
      reserved: 0,
      available: 10,
    }));
    expect(reservationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'cancelled',
    }));
  });

  it('restocks inventory for a fulfilled reservation return', async () => {
    const reservation: Partial<StockReservation> = {
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      orderId: 'order-1',
      channel: 'flipflop',
      quantity: 3,
      status: 'fulfilled',
    };
    const { service, stockRepository, reservationRepository, movementRepository } = createService({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      quantity: 7,
      reserved: 0,
      available: 7,
      lowStockThreshold: 5,
    }, [reservation]);

    await service.returnReservation('product-1', 'warehouse-1', 'order-1', context, 'flipflop');

    expect(stockRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 10,
      reserved: 0,
      available: 10,
    }));
    expect(reservationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'returned',
    }));
    expect(movementRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      type: 'return',
      quantity: 3,
      toWarehouseId: 'warehouse-1',
    }));
  });
});
