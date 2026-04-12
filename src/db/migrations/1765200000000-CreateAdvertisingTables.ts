import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdvertisingTables1765200000000
  implements MigrationInterface
{
  name = 'CreateAdvertisingTables1765200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "advertisements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(120) NOT NULL,
        "image_key" character varying NOT NULL,
        "target_url" character varying,
        "is_redirect_enabled" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "starts_at" TIMESTAMP WITH TIME ZONE,
        "ends_at" TIMESTAMP WITH TIME ZONE,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_advertisements_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "advertisement_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "advertisement_id" uuid,
        "action" character varying(40) NOT NULL,
        "title" character varying(120) NOT NULL,
        "image_key" character varying NOT NULL,
        "target_url" character varying,
        "is_redirect_enabled" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "starts_at" TIMESTAMP WITH TIME ZONE,
        "ends_at" TIMESTAMP WITH TIME ZONE,
        "changed_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_advertisement_history_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "advertisement_history"
      ADD CONSTRAINT "FK_advertisement_history_advertisement"
      FOREIGN KEY ("advertisement_id") REFERENCES "advertisements"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_advertisements_is_active_sort_order"
      ON "advertisements" ("is_active", "sort_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_advertisements_is_active_sort_order"
    `);
    await queryRunner.query(`
      ALTER TABLE "advertisement_history"
      DROP CONSTRAINT IF EXISTS "FK_advertisement_history_advertisement"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "advertisement_history"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "advertisements"
    `);
  }
}
