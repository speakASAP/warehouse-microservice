import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Warehouse } from '../warehouses/warehouse.entity';

/**
 * Stock Entity - Product + warehouse + quantity + reserved
 */
@Entity('stock')
@Unique(['productId', 'warehouseId'])
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Product ID from catalog-microservice
  @Column()
  productId: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.stock)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ name: 'warehouse_id' })
  warehouseId: string;

  // Total quantity in stock
  @Column({ type: 'int', default: 0 })
  quantity: number;

  // Reserved for pending orders
  @Column({ type: 'int', default: 0 })
  reserved: number;

  // Available = quantity - reserved
  @Column({ type: 'int', default: 0 })
  available: number;

  // Low stock threshold
  @Column({ type: 'int', default: 5 })
  lowStockThreshold: number;

  // Location within warehouse (shelf, bin, etc.)
  @Column({ length: 100, nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

