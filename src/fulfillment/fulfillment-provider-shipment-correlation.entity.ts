import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FulfillmentOrder } from './fulfillment-order.entity';

export type FulfillmentProviderShipmentCorrelationStatus = 'active' | 'revoked';

@Entity('fulfillment_provider_shipment_correlations')
@Index('IDX_fulfillment_provider_shipment_correlation_key', ['provider', 'sourceChannel', 'sourceReferenceHash'])
@Index('IDX_fulfillment_provider_shipment_correlation_order', ['centralOrderId', 'fulfillmentOrderId'])
export class FulfillmentProviderShipmentCorrelation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  provider: string;

  @Column({ name: 'source_channel', length: 100 })
  sourceChannel: string;

  @Column({ name: 'central_order_id', length: 200 })
  centralOrderId: string;

  @ManyToOne(() => FulfillmentOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fulfillment_order_id' })
  fulfillmentOrder: FulfillmentOrder;

  @Column({ name: 'fulfillment_order_id', type: 'uuid' })
  fulfillmentOrderId: string;

  @Column({ name: 'account_id_hash', length: 80, nullable: true })
  accountIdHash: string;

  @Column({ name: 'external_order_id_hash', length: 80 })
  externalOrderIdHash: string;

  @Column({ name: 'shipment_id_hash', length: 80, nullable: true })
  shipmentIdHash: string;

  @Column({ name: 'waybill_id_hash', length: 80, nullable: true })
  waybillIdHash: string;

  @Column({ name: 'source_reference_hash', length: 80 })
  sourceReferenceHash: string;

  @Column({ length: 30, default: 'active' })
  status: FulfillmentProviderShipmentCorrelationStatus;

  @Column({ name: 'reason_code', length: 100 })
  reasonCode: string;

  @Column({ name: 'created_by', length: 200 })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
