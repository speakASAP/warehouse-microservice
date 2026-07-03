import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFulfillmentProviderStatusObservations1781600000000 implements MigrationInterface {
  name = 'CreateFulfillmentProviderStatusObservations1781600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fulfillment_provider_status_observations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "idempotency_key" character varying(500) NOT NULL,
        "content_hash" character varying(128) NOT NULL,
        "provider" character varying(100) NOT NULL,
        "source_channel" character varying(100) NOT NULL,
        "central_order_id" character varying(200) NOT NULL,
        "fulfillment_order_id" uuid,
        "source_reference_hash" character varying(200) NOT NULL,
        "normalized_warehouse_status" character varying(50),
        "source_status_class" character varying(100) NOT NULL,
        "status_observed_at" TIMESTAMP,
        "source_updated_at" TIMESTAMP,
        "observed_at" TIMESTAMP NOT NULL,
        "decision" character varying(30) NOT NULL,
        "rejection_reason" character varying(100),
        "source_metadata" jsonb,
        "first_seen_at" TIMESTAMP NOT NULL,
        "last_seen_at" TIMESTAMP NOT NULL,
        "attempt_count" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fulfillment_provider_status_observations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fulfillment_provider_status_key_hash"
      ON "fulfillment_provider_status_observations" ("idempotency_key", "content_hash")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fulfillment_provider_status_order_source"
      ON "fulfillment_provider_status_observations" (
        "provider",
        "source_channel",
        "central_order_id",
        "source_reference_hash",
        "source_status_class"
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fulfillment_provider_status_fulfillment_order"
      ON "fulfillment_provider_status_observations" ("fulfillment_order_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fulfillment_provider_status_decision_seen"
      ON "fulfillment_provider_status_observations" ("decision", "last_seen_at")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_fulfillment_provider_status_fulfillment_order'
        ) THEN
          ALTER TABLE "fulfillment_provider_status_observations"
          ADD CONSTRAINT "FK_fulfillment_provider_status_fulfillment_order"
          FOREIGN KEY ("fulfillment_order_id") REFERENCES "fulfillment_orders"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fulfillment_provider_status_observations"
      DROP CONSTRAINT IF EXISTS "FK_fulfillment_provider_status_fulfillment_order"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_provider_status_decision_seen"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_provider_status_fulfillment_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_provider_status_order_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_provider_status_key_hash"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fulfillment_provider_status_observations"`);
  }
}
