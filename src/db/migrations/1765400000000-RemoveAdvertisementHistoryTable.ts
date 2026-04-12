import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveAdvertisementHistoryTable1765400000000
  implements MigrationInterface
{
  name = 'RemoveAdvertisementHistoryTable1765400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "advertisement_history"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
  }
}
