import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeClientAddressNullable1765900000000
  implements MigrationInterface
{
  name = 'MakeClientAddressNullable1765900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "address" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "clients" SET "address" = '' WHERE "address" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "address" SET NOT NULL`,
    );
  }
}
