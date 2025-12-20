import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Warehouse } from '../warehouses/warehouse.entity';

/**
 * StockReservation Entity - Reserved for pending orders
 */
@Entity('stock_reservations')
export class StockReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  @Column({ type: 'int' })
  quantity: number;

  // Order ID that reserved this stock
  @Column({ length: 200 })
  orderId: string;

  // Sales channel that created the order
  @Column({ length: 100 })
  channel: string;

  // Status: active, fulfilled, cancelled, expired
  @Column({ length: 50, default: 'active' })
  status: string;

  // Expiration time for the reservation
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

