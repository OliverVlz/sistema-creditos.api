import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveDocumentAndPhoneToUser1730665920000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "document_number" VARCHAR`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" VARCHAR`,
    );

    await queryRunner.query(`
      UPDATE "users" u
      SET 
        "document_number" = c."document_number",
        "phone_number" = c."phone_number"
      FROM "clients" c
      WHERE c."user_id" = u."id"
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "document_number" = 'TEMP-' || id
      WHERE "document_number" IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "document_number" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_document_number" ON "users" ("document_number")`,
    );

    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN IF EXISTS "document_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN IF EXISTS "phone_number"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "document_number" VARCHAR`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "phone_number" VARCHAR`,
    );

    await queryRunner.query(`
      UPDATE "clients" c
      SET 
        "document_number" = u."document_number",
        "phone_number" = u."phone_number"
      FROM "users" u
      WHERE c."user_id" = u."id"
    `);

    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "document_number" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_clients_document_number" ON "clients" ("document_number")`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_users_document_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "document_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_number"`,
    );
  }
}
