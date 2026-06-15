import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplierConflictReviewMetadata1781400000000 implements MigrationInterface {
  name = 'AddSupplierConflictReviewMetadata1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "supplier_stock_reconciliations"
      ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "reviewedBy" character varying(200),
      ADD COLUMN IF NOT EXISTS "operatorNote" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "supplier_stock_reconciliations"
      DROP COLUMN IF EXISTS "operatorNote",
      DROP COLUMN IF EXISTS "reviewedBy",
      DROP COLUMN IF EXISTS "reviewedAt"
    `);
  }
}
