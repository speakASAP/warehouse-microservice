import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { Stock } from '../src/stock/stock.entity';
import { StockService, StockMutationContext } from '../src/stock/stock.service';

describe('StockService mutation invariants', () => {
  const context: StockMutationContext = {
    reasonCode: 'ORDER_FULFILLED',
    actor: 'orders-microservice',
  };

  function createService(existingStock?: Partial<Stock>) {
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

    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === Stock) return stockRepository;
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
});
