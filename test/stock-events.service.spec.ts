import 'reflect-metadata';
import { StockEventOutbox } from '../src/stock/stock-event-outbox.entity';
import { StockEventsService } from '../src/stock/stock-events.service';

describe('StockEventsService outbox replay', () => {
  function createService(events: StockEventOutbox[]) {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        { status: 'pending', count: '1' },
        { status: 'failed', count: '2' },
      ]),
    };
    const outboxRepository = {
      find: jest.fn().mockResolvedValue(events),
      save: jest.fn(async (event) => event),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    const service = new StockEventsService(logger as any, outboxRepository as any);
    return { service, outboxRepository, logger };
  }

  function event(overrides: Partial<StockEventOutbox> = {}): StockEventOutbox {
    return Object.assign(new StockEventOutbox(), {
      id: 'outbox-1',
      eventId: '00000000-0000-4000-8000-000000000001',
      type: 'stock.updated',
      routingKey: 'stock.updated',
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      payload: {
        eventId: '00000000-0000-4000-8000-000000000001',
        type: 'stock.updated',
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        quantity: 6,
        available: 6,
        timestamp: '2026-06-13T10:00:00.000Z',
      },
      status: 'pending',
      attempts: 0,
      maxAttempts: 12,
      nextAttemptAt: null,
      lastError: null,
      publishedAt: null,
      createdAt: new Date('2026-06-13T10:00:00.000Z'),
      updatedAt: new Date('2026-06-13T10:00:00.000Z'),
      ...overrides,
    });
  }

  it('publishes due outbox rows and marks them published', async () => {
    const pendingEvent = event();
    const { service, outboxRepository } = createService([pendingEvent]);
    (service as any).channel = { publish: jest.fn() };

    const results = await service.replayPendingOutbox();

    expect(results).toEqual([expect.objectContaining({
      type: 'stock.updated',
      status: 'published',
      eventId: '00000000-0000-4000-8000-000000000001',
    })]);
    expect((service as any).channel.publish).toHaveBeenCalledWith(
      'stock.events',
      'stock.updated',
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        contentType: 'application/json',
        messageId: '00000000-0000-4000-8000-000000000001',
      }),
    );
    expect(outboxRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'publishing' }));
    expect(outboxRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'published',
      attempts: 1,
      lastError: null,
      nextAttemptAt: null,
      publishedAt: expect.any(Date),
    }));
  });

  it('keeps failed rows for retry when RabbitMQ is unavailable', async () => {
    const pendingEvent = event();
    const { service, outboxRepository } = createService([pendingEvent]);

    const results = await service.replayPendingOutbox();

    expect(results).toEqual([expect.objectContaining({
      type: 'stock.updated',
      status: 'failed',
      eventId: '00000000-0000-4000-8000-000000000001',
      error: 'RabbitMQ channel not available',
    })]);
    expect(outboxRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      attempts: 1,
      lastError: 'RabbitMQ channel not available',
      nextAttemptAt: expect.any(Date),
      publishedAt: null,
    }));
  });

  it('exposes outbox counts in publish status', async () => {
    const { service } = createService([]);

    await expect(service.getPublishStatus()).resolves.toEqual(expect.objectContaining({
      outbox: expect.objectContaining({
        counts: {
          pending: 1,
          publishing: 0,
          published: 0,
          failed: 2,
        },
        batchSize: 25,
        retryDelayMs: 30000,
      }),
    }));
  });
});
