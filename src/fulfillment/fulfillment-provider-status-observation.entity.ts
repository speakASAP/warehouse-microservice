import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FulfillmentOrderStatus } from './fulfillment-order.entity';

export type FulfillmentProviderStatusDecision =
  | 'accepted'
  | 'duplicate'
  | 'noop'
  | 'rejected'
  | 'conflict';

@Entity('fulfillment_provider_status_observations')
@Index('IDX_fulfillment_provider_status_key_hash', ['idempotencyKey', 'contentHash'], { unique: true })
@Index('IDX_fulfillment_provider_status_order_source', [
  'provider',
  'sourceChannel',
  'centralOrderId',
  'sourceReferenceHash',
  'sourceStatusClass',
])
export class FulfillmentProviderStatusObservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'idempotency_key', length: 500 })
  idempotencyKey: string;

  @Column({ name: 'content_hash', length: 128 })
  contentHash: string;

  @Column({ length: 100 })
  provider: string;

  @Column({ name: 'source_channel', length: 100 })
  sourceChannel: string;

  @Column({ name: 'central_order_id', length: 200 })
  centralOrderId: string;

  @Column({ name: 'fulfillment_order_id', type: 'uuid', nullable: true })
  fulfillmentOrderId: string;

  @Column({ name: 'source_reference_hash', length: 200 })
  sourceReferenceHash: string;

  @Column({ name: 'normalized_warehouse_status', length: 50, nullable: true })
  normalizedWarehouseStatus: FulfillmentOrderStatus | 'noop';

  @Column({ name: 'source_status_class', length: 100 })
  sourceStatusClass: string;

  @Column({ name: 'status_observed_at', type: 'timestamp', nullable: true })
  statusObservedAt: Date;

  @Column({ name: 'source_updated_at', type: 'timestamp', nullable: true })
  sourceUpdatedAt: Date;

  @Column({ name: 'observed_at', type: 'timestamp' })
  observedAt: Date;

  @Column({ length: 30 })
  decision: FulfillmentProviderStatusDecision;

  @Column({ name: 'rejection_reason', length: 100, nullable: true })
  rejectionReason: string;

  @Column({ name: 'source_metadata', type: 'jsonb', nullable: true })
  sourceMetadata: Record<string, unknown>;

  @Column({ name: 'first_seen_at', type: 'timestamp' })
  firstSeenAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamp' })
  lastSeenAt: Date;

  @Column({ name: 'attempt_count', type: 'int', default: 1 })
  attemptCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
