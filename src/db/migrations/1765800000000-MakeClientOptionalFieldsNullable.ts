import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeClientOptionalFieldsNullable1765800000000
  implements MigrationInterface
{
  name = 'MakeClientOptionalFieldsNullable1765800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "birth_date" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "employment_status" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "organization_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" ALTER COLUMN "organization_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "clients" SET "birth_date" = DATE '1900-01-01' WHERE "birth_date" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "clients" SET "employment_status" = 'ACTIVO' WHERE "employment_status" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "clients" SET "organization_id" = (SELECT "id" FROM "organizations" ORDER BY "created_at" ASC LIMIT 1) WHERE "organization_id" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "loans" SET "organization_id" = (SELECT "id" FROM "organizations" ORDER BY "created_at" ASC LIMIT 1) WHERE "organization_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" ALTER COLUMN "organization_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "organization_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "employment_status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "birth_date" SET NOT NULL`,
    );
  }
}
