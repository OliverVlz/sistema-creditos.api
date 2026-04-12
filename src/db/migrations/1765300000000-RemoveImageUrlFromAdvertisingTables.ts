import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveImageUrlFromAdvertisingTables1765300000000
  implements MigrationInterface
{
  name = 'RemoveImageUrlFromAdvertisingTables1765300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "advertisement_history"
      DROP COLUMN IF EXISTS "image_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "advertisements"
      DROP COLUMN IF EXISTS "image_url"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "advertisements"
      ADD COLUMN IF NOT EXISTS "image_url" character varying
    `);
    await queryRunner.query(`
      UPDATE "advertisements"
      SET "image_url" = "image_key"
      WHERE "image_url" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "advertisements"
      ALTER COLUMN "image_url" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "advertisement_history"
      ADD COLUMN IF NOT EXISTS "image_url" character varying
    `);
    await queryRunner.query(`
      UPDATE "advertisement_history"
      SET "image_url" = "image_key"
      WHERE "image_url" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "advertisement_history"
      ALTER COLUMN "image_url" SET NOT NULL
    `);
  }
}
