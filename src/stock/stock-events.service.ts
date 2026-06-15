import { randomUUID } from 'crypto';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as amqp from 'amqplib';
import { LessThanOrEqual, Repository } from 'typeorm';
import { LoggerService } from '../logger/logger.service';
import { StockEventOutbox, StockEventPayload, StockEventType } from './stock-event-outbox.entity';

export type StockEventPublishResult = {
  type: StockEventType;
  status: 'published' | 'failed';
  eventId?: string;
  error?: string;
  timestamp: string;
};

type StockEventOutboxCounts = Record<'pending' | 'publishing' | 'published' | 'failed', number>;

@Injectable()
export class StockEventsService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private lastConnectionError: string | null = null;
  private publishAttempts = 0;
  private publishFailures = 0;
  private replayAttempts = 0;
  private replayFailures = 0;
  private lastPublishResult: StockEventPublishResult | null = null;
  private lastReplayAt: string | null = null;
  private replayTimer: NodeJS.Timeout | null = null;
  private readonly exchangeName = 'stock.events';
  private readonly replayBatchSize = parseInt(process.env.STOCK_EVENT_OUTBOX_BATCH_SIZE || '25', 10);
  private readonly replayIntervalMs = parseInt(process.env.STOCK_EVENT_OUTBOX_REPLAY_INTERVAL_MS || '60000', 10);
  private readonly retryDelayMs = parseInt(process.env.STOCK_EVENT_OUTBOX_RETRY_DELAY_MS || '30000', 10);

  constructor(
    private readonly logger: LoggerService,
    @InjectRepository(StockEventOutbox)
    private readonly outboxRepository: Repository<StockEventOutbox>,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.replayPendingOutbox();
    this.startReplayTimer();
  }

  async onModuleDestroy() {
    if (this.replayTimer) {
      clearInterval(this.replayTimer);
      this.replayTimer = null;
    }
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      this.logger.log(`Connecting to RabbitMQ: ${url}`, 'StockEventsService');

      const conn = await amqp.connect(url);
      this.connection = conn;
      if (!this.connection) {
        throw new Error('Failed to establish RabbitMQ connection');
      }
      const ch = await this.connection.createChannel();
      this.channel = ch as unknown as amqp.Channel;
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });

      this.lastConnectionError = null;
      this.logger.log('Connected to RabbitMQ', 'StockEventsService');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.lastConnectionError = errorMessage;
      this.logger.error(`Failed to connect to RabbitMQ: ${errorMessage}`, errorStack, 'StockEventsService');
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log('Disconnected from RabbitMQ', 'StockEventsService');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error disconnecting from RabbitMQ: ${errorMessage}`, errorStack, 'StockEventsService');
    }
  }

  private startReplayTimer() {
    if (this.replayIntervalMs <= 0 || this.replayTimer) {
      return;
    }

    this.replayTimer = setInterval(() => {
      this.replayPendingOutbox().catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(`Stock event outbox replay failed: ${errorMessage}`, errorStack, 'StockEventsService');
      });
    }, this.replayIntervalMs);
  }

  getConnectionStatus() {
    return {
      status: this.channel ? 'up' : 'down',
      exchange: this.exchangeName,
      lastError: this.lastConnectionError,
    };
  }

  async getPublishStatus() {
    return {
      attempts: this.publishAttempts,
      failures: this.publishFailures,
      lastResult: this.lastPublishResult,
      outbox: {
        counts: await this.getOutboxCounts(),
        replayAttempts: this.replayAttempts,
        replayFailures: this.replayFailures,
        lastReplayAt: this.lastReplayAt,
        batchSize: this.replayBatchSize,
        retryDelayMs: this.retryDelayMs,
      },
    };
  }

  async replayPendingOutbox(limit = this.replayBatchSize): Promise<StockEventPublishResult[]> {
    const dueEvents = await this.outboxRepository.find({
      where: [
        { status: 'pending' },
        { status: 'failed', nextAttemptAt: LessThanOrEqual(new Date()) },
      ],
      order: { createdAt: 'ASC' },
      take: limit,
    } as any);

    const eligibleEvents = dueEvents.filter((event) => event.attempts < event.maxAttempts);
    if (eligibleEvents.length === 0) {
      return [];
    }

    this.replayAttempts += 1;
    this.lastReplayAt = new Date().toISOString();
    const results: StockEventPublishResult[] = [];

    for (const outboxEvent of eligibleEvents) {
      outboxEvent.status = 'publishing';
      await this.outboxRepository.save({ ...outboxEvent });

      const result = await this.publish(outboxEvent.routingKey, outboxEvent.payload);
      results.push(result);

      outboxEvent.attempts += 1;
      if (result.status === 'published') {
        outboxEvent.status = 'published';
        outboxEvent.lastError = null;
        outboxEvent.nextAttemptAt = null;
        outboxEvent.publishedAt = new Date();
      } else {
        this.replayFailures += 1;
        outboxEvent.status = 'failed';
        outboxEvent.lastError = result.error ?? 'Unknown publish failure';
        outboxEvent.nextAttemptAt = outboxEvent.attempts >= outboxEvent.maxAttempts
          ? null
          : new Date(Date.now() + this.retryDelayMs);
      }

      await this.outboxRepository.save({ ...outboxEvent });
      this.logPublishResult(result, outboxEvent.productId, outboxEvent.warehouseId, outboxEvent.payload.available, outboxEvent.payload.threshold);
    }

    return results;
  }

  async publishStockUpdated(productId: string, warehouseId: string, quantity: number, available: number): Promise<StockEventPublishResult> {
    const event: StockEventPayload = {
      eventId: randomUUID(),
      type: 'stock.updated',
      productId,
      warehouseId,
      quantity,
      available,
      timestamp: new Date().toISOString(),
    };

    const result = await this.publish('stock.updated', event);
    this.logPublishResult(result, productId, warehouseId, available);
    return result;
  }

  async publishStockLow(productId: string, warehouseId: string, available: number, threshold: number): Promise<StockEventPublishResult> {
    const event: StockEventPayload = {
      eventId: randomUUID(),
      type: 'stock.low',
      productId,
      warehouseId,
      available,
      threshold,
      timestamp: new Date().toISOString(),
    };

    const result = await this.publish('stock.low', event);
    this.logPublishResult(result, productId, warehouseId, available, threshold);
    return result;
  }

  async publishStockOut(productId: string, warehouseId: string): Promise<StockEventPublishResult> {
    const event: StockEventPayload = {
      eventId: randomUUID(),
      type: 'stock.out',
      productId,
      warehouseId,
      timestamp: new Date().toISOString(),
    };

    const result = await this.publish('stock.out', event);
    this.logPublishResult(result, productId, warehouseId);
    return result;
  }

  private async publish(routingKey: StockEventType, event: StockEventPayload): Promise<StockEventPublishResult> {
    this.validateEvent(routingKey, event);
    this.publishAttempts += 1;

    if (!this.channel) {
      return this.recordPublishFailure(routingKey, 'RabbitMQ channel not available', event.eventId);
    }

    try {
      const message = JSON.stringify(event);
      this.channel.publish(this.exchangeName, routingKey, Buffer.from(message), {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
      });
      return this.recordPublishSuccess(routingKey, event.eventId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to publish event: ${errorMessage}`, errorStack, 'StockEventsService');
      return this.recordPublishFailure(routingKey, errorMessage, event.eventId);
    }
  }

  private recordPublishSuccess(type: StockEventType, eventId?: string): StockEventPublishResult {
    const result: StockEventPublishResult = {
      type,
      status: 'published',
      eventId,
      timestamp: new Date().toISOString(),
    };
    this.lastPublishResult = result;
    return result;
  }

  private recordPublishFailure(type: StockEventType, error: string, eventId?: string): StockEventPublishResult {
    this.publishFailures += 1;
    this.lastConnectionError = error;
    const result: StockEventPublishResult = {
      type,
      status: 'failed',
      eventId,
      error,
      timestamp: new Date().toISOString(),
    };
    this.lastPublishResult = result;
    this.logger.error(`Stock event publish failed: type=${type} eventId=${eventId ?? 'none'} error=${error}`, '', 'StockEventsService');
    return result;
  }

  private logPublishResult(
    result: StockEventPublishResult,
    productId: string,
    warehouseId: string,
    available?: number,
    threshold?: number,
  ) {
    const fields = [
      `event=${result.type}`,
      result.eventId ? `eventId=${result.eventId}` : null,
      `status=${result.status}`,
      `productId=${productId}`,
      `warehouseId=${warehouseId}`,
      available === undefined ? null : `available=${available}`,
      threshold === undefined ? null : `threshold=${threshold}`,
      result.error ? `error=${result.error}` : null,
    ].filter(Boolean).join(' ');

    if (result.status === 'published') {
      this.logger.log(`stock_event_publish ${fields}`, 'StockEventsService');
    } else {
      this.logger.error(`stock_event_publish ${fields}`, '', 'StockEventsService');
    }
  }

  private validateEvent(routingKey: StockEventType, event: StockEventPayload) {
    if (event.type !== routingKey) {
      throw new Error(`Invalid stock event: routing key ${routingKey} does not match type ${event.type}`);
    }
    if (!event.eventId || !event.productId || !event.warehouseId || !event.timestamp) {
      throw new Error(`Invalid ${event.type} event: eventId, productId, warehouseId, and timestamp are required`);
    }
    if (Number.isNaN(Date.parse(event.timestamp))) {
      throw new Error(`Invalid ${event.type} event: timestamp must be ISO-8601 parseable`);
    }
    if (event.type === 'stock.updated') {
      this.assertNumber(event.quantity, 'quantity', event.type);
      this.assertNumber(event.available, 'available', event.type);
    }
    if (event.type === 'stock.low') {
      this.assertNumber(event.available, 'available', event.type);
      this.assertNumber(event.threshold, 'threshold', event.type);
    }
  }

  private assertNumber(value: number | undefined, field: string, eventType: string) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`Invalid ${eventType} event: ${field} must be a finite number`);
    }
  }

  private async getOutboxCounts(): Promise<StockEventOutboxCounts> {
    const counts: StockEventOutboxCounts = {
      pending: 0,
      publishing: 0,
      published: 0,
      failed: 0,
    };

    try {
      const rows = await this.outboxRepository
        .createQueryBuilder('event')
        .select('event.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.status')
        .getRawMany();

      for (const row of rows) {
        if (row.status in counts) {
          counts[row.status as keyof StockEventOutboxCounts] = parseInt(row.count, 10);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to read stock event outbox status: ${errorMessage}`, '', 'StockEventsService');
    }

    return counts;
  }
}
