import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Stock } from '../stock/stock.entity';

/**
 * Warehouse Entity - Own warehouses and supplier dropship locations
 */
@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100, unique: true })
  code: string;

  // Type: own, supplier, dropship
  @Column({ length: 50 })
  type: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 20, nullable: true })
  postalCode: string;

  @Column({ length: 2, nullable: true })
  country: string;

  @Column({ length: 200, nullable: true })
  contactEmail: string;

  @Column({ length: 50, nullable: true })
  contactPhone: string;

  // For supplier warehouses - link to supplier
  @Column({ nullable: true })
  supplierId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  priority: number; // For stock allocation

  @OneToMany(() => Stock, (stock) => stock.warehouse)
  stock: Stock[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

