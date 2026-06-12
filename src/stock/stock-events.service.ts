import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';
import { LoggerService } from '../logger/logger.service';

type StockEventPayload = {
  type: 'stock.updated' | 'stock.low' | 'stock.out';
  productId: string;
  warehouseId: string;
  quantity?: number;
  available?: number;
  threshold?: number;
  timestamp: string;
};

export type StockEventPublishResult = {
  type: StockEventPayload['type'];
  status: 'published' | 'failed';
  error?: string;
  timestamp: string;
};

/**
 * Service for publishing stock events to RabbitMQ
 */
@Injectable()
export class StockEventsService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private lastConnectionError: string | null = null;
  private publishAttempts = 0;
  private publishFailures = 0;
  private lastPublishResult: StockEventPublishResult | null = null;
  private readonly exchangeName = 'stock.events';

  constructor(private readonly logger: LoggerService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
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

      // Declare exchange for stock events
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

  /**
   * Current RabbitMQ publishing dependency state for health/readiness.
   */
  getConnectionStatus() {
    return {
      status: this.channel ? 'up' : 'down',
      exchange: this.exchangeName,
      lastError: this.lastConnectionError,
    };
  }

  getPublishStatus() {
    return {
      attempts: this.publishAttempts,
      failures: this.publishFailures,
      lastResult: this.lastPublishResult,
    };
  }

  /**
   * Publish stock.updated event
   */
  async publishStockUpdated(productId: string, warehouseId: string, quantity: number, available: number): Promise<StockEventPublishResult> {
    const event: StockEventPayload = {
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

  /**
   * Publish stock.low event when stock falls below threshold
   */
  async publishStockLow(productId: string, warehouseId: string, available: number, threshold: number): Promise<StockEventPublishResult> {
    const event: StockEventPayload = {
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

  /**
   * Publish stock.out event when stock reaches zero
   */
  async publishStockOut(productId: string, warehouseId: string): Promise<StockEventPublishResult> {
    const event: StockEventPayload = {
      type: 'stock.out',
      productId,
      warehouseId,
      timestamp: new Date().toISOString(),
    };

    const result = await this.publish('stock.out', event);
    this.logPublishResult(result, productId, warehouseId);
    return result;
  }

  private async publish(routingKey: StockEventPayload['type'], event: StockEventPayload): Promise<StockEventPublishResult> {
    this.validateEvent(routingKey, event);
    this.publishAttempts += 1;

    if (!this.channel) {
      return this.recordPublishFailure(routingKey, 'RabbitMQ channel not available');
    }

    try {
      const message = JSON.stringify(event);
      this.channel.publish(this.exchangeName, routingKey, Buffer.from(message), {
        persistent: true,
        contentType: 'application/json',
      });
      return this.recordPublishSuccess(routingKey);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to publish event: ${errorMessage}`, errorStack, 'StockEventsService');
      return this.recordPublishFailure(routingKey, errorMessage);
    }
  }

  private recordPublishSuccess(type: StockEventPayload['type']): StockEventPublishResult {
    const result: StockEventPublishResult = {
      type,
      status: 'published',
      timestamp: new Date().toISOString(),
    };
    this.lastPublishResult = result;
    return result;
  }

  private recordPublishFailure(type: StockEventPayload['type'], error: string): StockEventPublishResult {
    this.publishFailures += 1;
    this.lastConnectionError = error;
    const result: StockEventPublishResult = {
      type,
      status: 'failed',
      error,
      timestamp: new Date().toISOString(),
    };
    this.lastPublishResult = result;
    this.logger.error(`Stock event publish failed: type=${type} error=${error}`, '', 'StockEventsService');
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

  private validateEvent(routingKey: StockEventPayload['type'], event: StockEventPayload) {
    if (event.type !== routingKey) {
      throw new Error(`Invalid stock event: routing key ${routingKey} does not match type ${event.type}`);
    }
    if (!event.productId || !event.warehouseId || !event.timestamp) {
      throw new Error(`Invalid ${event.type} event: productId, warehouseId, and timestamp are required`);
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
}
