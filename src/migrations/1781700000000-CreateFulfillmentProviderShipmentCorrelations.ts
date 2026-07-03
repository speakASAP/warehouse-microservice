import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFulfillmentProviderShipmentCorrelations1781700000000 implements MigrationInterface {
  name = 'CreateFulfillmentProviderShipmentCorrelations1781700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fulfillment_provider_shipment_correlations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider" character varying(100) NOT NULL,
        "source_channel" character varying(100) NOT NULL,
        "central_order_id" character varying(200) NOT NULL,
        "fulfillment_order_id" uuid NOT NULL,
        "account_id_hash" character varying(80),
        "external_order_id_hash" character varying(80) NOT NULL,
        "shipment_id_hash" character varying(80),
        "waybill_id_hash" character varying(80),
        "source_reference_hash" character varying(80) NOT NULL,
        "status" character varying(30) NOT NULL DEFAULT 'active',
        "reason_code" character varying(100) NOT NULL,
        "created_by" character varying(200) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fulfillment_provider_shipment_correlations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_fulfillment_provider_shipment_correlation_active_unique"
      ON "fulfillment_provider_shipment_correlations" ("provider", "source_channel", "source_reference_hash")
      WHERE "status" = 'active'
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fulfillment_provider_shipment_correlation_order"
      ON "fulfillment_provider_shipment_correlations" ("central_order_id", "fulfillment_order_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_fulfillment_provider_shipment_correlation_hashes"
      ON "fulfillment_provider_shipment_correlations" (
        "account_id_hash",
        "external_order_id_hash",
        "shipment_id_hash",
        "waybill_id_hash"
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_fulfillment_provider_shipment_correlation_order'
        ) THEN
          ALTER TABLE "fulfillment_provider_shipment_correlations"
          ADD CONSTRAINT "FK_fulfillment_provider_shipment_correlation_order"
          FOREIGN KEY ("fulfillment_order_id") REFERENCES "fulfillment_orders"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "fulfillment_provider_shipment_correlations"
      DROP CONSTRAINT IF EXISTS "FK_fulfillment_provider_shipment_correlation_order"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_provider_shipment_correlation_hashes"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_provider_shipment_correlation_order"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_fulfillment_provider_shipment_correlation_active_unique"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fulfillment_provider_shipment_correlations"`);
  }
}
