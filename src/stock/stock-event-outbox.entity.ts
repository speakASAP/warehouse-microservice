import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type StockEventType = 'stock.updated' | 'stock.low' | 'stock.out';
export type StockEventOutboxStatus = 'pending' | 'publishing' | 'published' | 'failed';

export type StockEventPayload = {
  eventId: string;
  type: StockEventType;
  productId: string;
  warehouseId: string;
  quantity?: number;
  available?: number;
  threshold?: number;
  timestamp: string;
};

@Entity('stock_event_outbox')
@Index('IDX_stock_event_outbox_status_next_attempt', ['status', 'nextAttemptAt'])
@Index('IDX_stock_event_outbox_created_at', ['createdAt'])
@Index('IDX_stock_event_outbox_product_warehouse', ['productId', 'warehouseId'])
export class StockEventOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  eventId: string;

  @Column({ length: 50 })
  type: StockEventType;

  @Column({ length: 100 })
  routingKey: StockEventType;

  @Column({ length: 200 })
  productId: string;

  @Column({ length: 200 })
  warehouseId: string;

  @Column({ type: 'jsonb' })
  payload: StockEventPayload;

  @Column({ length: 50, default: 'pending' })
  status: StockEventOutboxStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 12 })
  maxAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  nextAttemptAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
