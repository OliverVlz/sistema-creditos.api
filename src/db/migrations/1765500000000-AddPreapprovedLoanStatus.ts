import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreapprovedLoanStatus1765500000000
  implements MigrationInterface
{
  name = 'AddPreapprovedLoanStatus1765500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."loans_status_enum"
      ADD VALUE IF NOT EXISTS 'preaprobado'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "public"."loans_status_enum" RENAME TO "loans_status_enum_old"
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."loans_status_enum" AS ENUM(
        'pendiente',
        'aprobado',
        'rechazado',
        'desembolsado'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "loans"
      ALTER COLUMN "status"
      TYPE "public"."loans_status_enum"
      USING (
        CASE
          WHEN "status"::text = 'preaprobado' THEN 'pendiente'
          ELSE "status"::text
        END
      )::"public"."loans_status_enum"
    `);
    await queryRunner.query(`
      DROP TYPE "public"."loans_status_enum_old"
    `);
  }
}
