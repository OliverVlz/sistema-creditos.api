import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSourceType1765600000000 implements MigrationInterface {
  name = 'AddUserSourceType1765600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type
          WHERE typname = 'users_source_type_enum'
        ) THEN
          CREATE TYPE "public"."users_source_type_enum" AS ENUM('manual', 'massive_import');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "source_type" "public"."users_source_type_enum" NOT NULL DEFAULT 'manual'
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "source_type" = 'manual'
      WHERE "source_type" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "source_type"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."users_source_type_enum"
    `);
  }
}
