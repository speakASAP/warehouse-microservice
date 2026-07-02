import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { FulfillmentOrderLine } from './fulfillment-order-line.entity';

export type FulfillmentOrderStatus = 'requested' | 'cancelled' | 'returned';

export interface FulfillmentDeliveryAddress {
  name?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface FulfillmentCustomerContact {
  name?: string;
  email?: string;
  phone?: string;
}

@Entity('fulfillment_orders')
@Unique(['orderId'])
export class FulfillmentOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', length: 200 })
  orderId: string;

  @Column({ name: 'order_number', length: 100, nullable: true })
  orderNumber: string;

  @Column({ length: 100, nullable: true })
  channel: string;

  @Column({ length: 50, default: 'requested' })
  status: FulfillmentOrderStatus;

  @Column({ name: 'shipping_method', length: 100 })
  shippingMethod: string;

  @Column({ name: 'delivery_address', type: 'jsonb' })
  deliveryAddress: FulfillmentDeliveryAddress;

  @Column({ name: 'customer_contact', type: 'jsonb', nullable: true })
  customerContact: FulfillmentCustomerContact;

  @Column({ name: 'reason_code', length: 100 })
  reasonCode: string;

  @Column({ name: 'requested_by', length: 200 })
  requestedBy: string;

  @Column({ length: 200, nullable: true })
  reference: string;

  @Column({ name: 'status_reason_code', length: 100, nullable: true })
  statusReasonCode: string;

  @Column({ name: 'status_actor', length: 200, nullable: true })
  statusActor: string;

  @Column({ name: 'status_reference', length: 200, nullable: true })
  statusReference: string;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'returned_at', type: 'timestamp', nullable: true })
  returnedAt: Date;

  @OneToMany(() => FulfillmentOrderLine, (line) => line.fulfillmentOrder, { cascade: ['insert'] })
  lines: FulfillmentOrderLine[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
