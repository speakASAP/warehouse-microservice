import { MigrationInterface, QueryRunner } from 'typeorm';

export class StockEventOutbox1781300000000 implements MigrationInterface {
  name = 'StockEventOutbox1781300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_event_outbox" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventId" uuid NOT NULL,
        "type" character varying(50) NOT NULL,
        "routingKey" character varying(100) NOT NULL,
        "productId" character varying(200) NOT NULL,
        "warehouseId" character varying(200) NOT NULL,
        "payload" jsonb NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "maxAttempts" integer NOT NULL DEFAULT 12,
        "nextAttemptAt" TIMESTAMP,
        "lastError" text,
        "publishedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stock_event_outbox_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stock_event_outbox_event_id" UNIQUE ("eventId")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_event_outbox_status_next_attempt"
      ON "stock_event_outbox" ("status", "nextAttemptAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_event_outbox_created_at"
      ON "stock_event_outbox" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_stock_event_outbox_product_warehouse"
      ON "stock_event_outbox" ("productId", "warehouseId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_event_outbox_product_warehouse"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_event_outbox_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_stock_event_outbox_status_next_attempt"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_event_outbox"`);
  }
}
