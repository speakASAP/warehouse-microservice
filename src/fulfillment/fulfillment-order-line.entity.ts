import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StockReservation } from '../reservations/stock-reservation.entity';
import { FulfillmentOrder } from './fulfillment-order.entity';

@Entity('fulfillment_order_lines')
@Unique(['reservationId'])
export class FulfillmentOrderLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FulfillmentOrder, (order) => order.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fulfillment_order_id' })
  fulfillmentOrder: FulfillmentOrder;

  @Column({ name: 'fulfillment_order_id', type: 'uuid' })
  fulfillmentOrderId: string;

  @ManyToOne(() => StockReservation)
  @JoinColumn({ name: 'reservation_id' })
  reservation: StockReservation;

  @Column({ name: 'reservation_id', type: 'uuid' })
  reservationId: string;

  @Column({ name: 'order_item_id', length: 200 })
  orderItemId: string;

  @Column({ name: 'product_id', length: 200 })
  productId: string;

  @Column({ length: 100, nullable: true })
  sku: string;

  @Column({ length: 500 })
  title: string;

  @Column({ name: 'warehouse_id', length: 200 })
  warehouseId: string;

  @Column({ type: 'int' })
  quantity: number;
}
