import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialWarehouseSchema1781200000000 implements MigrationInterface {
  name = 'InitialWarehouseSchema1781200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "warehouses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(200) NOT NULL,
        "code" character varying(100) NOT NULL,
        "type" character varying(50) NOT NULL,
        "address" text,
        "city" character varying(100),
        "postalCode" character varying(20),
        "country" character varying(2),
        "contactEmail" character varying(200),
        "contactPhone" character varying(50),
        "supplierId" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_warehouses_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" character varying NOT NULL,
        "warehouse_id" uuid NOT NULL,
        "quantity" integer NOT NULL DEFAULT 0,
        "reserved" integer NOT NULL DEFAULT 0,
        "available" integer NOT NULL DEFAULT 0,
        "lowStockThreshold" integer NOT NULL DEFAULT 5,
        "location" character varying(100),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" character varying NOT NULL,
        "type" character varying(50) NOT NULL,
        "quantity" integer NOT NULL,
        "from_warehouse_id" uuid,
        "to_warehouse_id" uuid,
        "reference" character varying(200),
        "reason" text,
        "createdBy" character varying(200),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_movements_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_reservations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "productId" character varying NOT NULL,
        "warehouse_id" uuid NOT NULL,
        "quantity" integer NOT NULL,
        "orderId" character varying(200) NOT NULL,
        "channel" character varying(100) NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'active',
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_reservations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "supplier_stock_reconciliations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "supplierId" character varying(200) NOT NULL,
        "warehouse_id" character varying(200) NOT NULL,
        "productId" character varying(200) NOT NULL,
        "supplierQuantity" integer NOT NULL,
        "previousQuantity" integer NOT NULL,
        "reservedQuantity" integer NOT NULL,
        "externalReference" character varying(200) NOT NULL,
        "status" character varying(50) NOT NULL,
        "conflictReason" text,
        "actor" character varying(200) NOT NULL,
        "observedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_supplier_stock_reconciliations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_warehouses_code_unique"
      ON "warehouses" ("code")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stock_product_warehouse_unique"
      ON "stock" ("productId", "warehouse_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_product_id"
      ON "stock" ("productId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_reservations_order_product_warehouse_channel"
      ON "stock_reservations" ("orderId", "productId", "warehouse_id", "channel")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_reservations_status_expires_at"
      ON "stock_reservations" ("status", "expiresAt")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_supplier_reconciliation_reference_unique"
      ON "supplier_stock_reconciliations" ("supplierId", "warehouse_id", "productId", "externalReference")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_stock_warehouse'
        ) THEN
          ALTER TABLE "stock"
          ADD CONSTRAINT "FK_stock_warehouse"
          FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_stock_movements_from_warehouse'
        ) THEN
          ALTER TABLE "stock_movements"
          ADD CONSTRAINT "FK_stock_movements_from_warehouse"
          FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_stock_movements_to_warehouse'
        ) THEN
          ALTER TABLE "stock_movements"
          ADD CONSTRAINT "FK_stock_movements_to_warehouse"
          FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_stock_reservations_warehouse'
        ) THEN
          ALTER TABLE "stock_reservations"
          ADD CONSTRAINT "FK_stock_reservations_warehouse"
          FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(): Promise<void> {
    throw new Error('Initial warehouse schema migration is the production baseline and cannot be reverted automatically.');
  }
}
