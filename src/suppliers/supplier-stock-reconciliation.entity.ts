import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type SupplierStockReconciliationStatus = 'applied' | 'conflict';

@Entity('supplier_stock_reconciliations')
@Index(['supplierId', 'warehouseId', 'productId', 'externalReference'], { unique: true })
export class SupplierStockReconciliation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  supplierId: string;

  @Column({ name: 'warehouse_id', length: 200 })
  warehouseId: string;

  @Column({ length: 200 })
  productId: string;

  @Column({ type: 'int' })
  supplierQuantity: number;

  @Column({ type: 'int' })
  previousQuantity: number;

  @Column({ type: 'int' })
  reservedQuantity: number;

  @Column({ length: 200 })
  externalReference: string;

  @Column({ length: 50 })
  status: SupplierStockReconciliationStatus;

  @Column({ type: 'text', nullable: true })
  conflictReason: string;

  @Column({ length: 200 })
  actor: string;

  @Column({ type: 'timestamp', nullable: true })
  observedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
