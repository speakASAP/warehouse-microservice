import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFulfillmentOrders1781500000000 implements MigrationInterface {
  name = 'CreateFulfillmentOrders1781500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fulfillment_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" character varying(200) NOT NULL,
        "order_number" character varying(100),
        "channel" character varying(100),
        "status" character varying(50) NOT NULL DEFAULT 'requested',
        "shipping_method" character varying(100) NOT NULL,
        "delivery_address" jsonb NOT NULL,
        "customer_contact" jsonb,
        "reason_code" character varying(100) NOT NULL,
        "requested_by" character varying(200) NOT NULL,
        "reference" character varying(200),
        "status_reason_code" character varying(100),
        "status_actor" character varying(200),
        "status_reference" character varying(200),
        "cancelled_at" TIMESTAMP,
        "returned_at" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fulfillment_orders_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fulfillment_order_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fulfillment_order_id" uuid NOT NULL,
        "reservation_id" uuid NOT NULL,
        "order_item_id" character varying(200) NOT NULL,
        "product_id" character varying(200) NOT NULL,
        "sku" character varying(100),
        "title" character varying(500) NOT NULL,
        "warehouse_id" character varying(200) NOT NULL,
        "quantity" integer NOT NULL,
        CONSTRAINT "PK_fulfillment_order_lines_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fulfillment_orders_order_id_unique"
      ON "fulfillment_orders" ("order_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fulfillment_orders_status_created"
      ON "fulfillment_orders" ("status", "createdAt")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fulfillment_order_lines_reservation_unique"
      ON "fulfillment_order_lines" ("reservation_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fulfillment_order_lines_order"
      ON "fulfillment_order_lines" ("fulfillment_order_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_fulfillment_order_lines_order'
        ) THEN
          ALTER TABLE "fulfillment_order_lines"
          ADD CONSTRAINT "FK_fulfillment_order_lines_order"
          FOREIGN KEY ("fulfillment_order_id") REFERENCES "fulfillment_orders"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_fulfillment_order_lines_reservation'
        ) THEN
          ALTER TABLE "fulfillment_order_lines"
          ADD CONSTRAINT "FK_fulfillment_order_lines_reservation"
          FOREIGN KEY ("reservation_id") REFERENCES "stock_reservations"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fulfillment_order_lines"
      DROP CONSTRAINT IF EXISTS "FK_fulfillment_order_lines_reservation"
    `);
    await queryRunner.query(`
      ALTER TABLE "fulfillment_order_lines"
      DROP CONSTRAINT IF EXISTS "FK_fulfillment_order_lines_order"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_order_lines_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_order_lines_reservation_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_orders_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_orders_order_id_unique"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fulfillment_order_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fulfillment_orders"`);
  }
}
