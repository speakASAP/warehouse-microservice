import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Warehouse } from '../warehouses/warehouse.entity';

/**
 * StockMovement Entity - In/out/transfer history
 */
@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  // Type: in, out, transfer, adjustment, reserve, unreserve
  @Column({ length: 50 })
  type: string;

  // Quantity (positive for in, negative for out)
  @Column({ type: 'int' })
  quantity: number;

  // Source warehouse (for transfers)
  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'from_warehouse_id' })
  fromWarehouse: Warehouse;

  @Column({ name: 'from_warehouse_id', nullable: true })
  fromWarehouseId: string;

  // Destination warehouse
  @ManyToOne(() => Warehouse, { nullable: true })
  @JoinColumn({ name: 'to_warehouse_id' })
  toWarehouse: Warehouse;

  @Column({ name: 'to_warehouse_id', nullable: true })
  toWarehouseId: string;

  // Reference (order ID, PO number, etc.)
  @Column({ length: 200, nullable: true })
  reference: string;

  // Reason for movement
  @Column({ type: 'text', nullable: true })
  reason: string;

  // User/system that made the change
  @Column({ length: 200, nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}

