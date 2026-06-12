import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OperationalMetricsService } from '../observability/operational-metrics.service';
import { StockEventsService } from '../stock/stock-events.service';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly dataSource: DataSource,
    private readonly stockEvents: StockEventsService,
    private readonly operationalMetrics: OperationalMetricsService,
  ) {}

  async getHealth() {
    const dependencies = await this.getDependencyStatus();

    return {
      status: 'healthy',
      service: process.env.SERVICE_NAME || 'warehouse-microservice',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      dependencies,
      operations: this.getOperationsStatus(),
    };
  }

  async getReady() {
    const dependencies = await this.getDependencyStatus();
    const ready = dependencies.database.status === 'up' && dependencies.rabbitmq.status === 'up';

    return {
      ready,
      status: ready ? 'ready' : 'not_ready',
      service: process.env.SERVICE_NAME || 'warehouse-microservice',
      timestamp: new Date().toISOString(),
      dependencies,
      operations: this.getOperationsStatus(),
    };
  }

  private async getDependencyStatus() {
    return {
      database: await this.getDatabaseStatus(),
      rabbitmq: this.stockEvents.getConnectionStatus(),
    };
  }

  private getOperationsStatus() {
    return {
      mutations: this.operationalMetrics.getMutationStatus(),
      stockEvents: this.stockEvents.getPublishStatus(),
    };
  }

  private async getDatabaseStatus() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', host: process.env.DB_HOST || 'db-server-postgres' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { status: 'down', host: process.env.DB_HOST || 'db-server-postgres', error: message };
    };
  }
}
