import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCreatorFields1763007034818 implements MigrationInterface {
  name = 'RemoveCreatorFields1763007034818';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loans" DROP CONSTRAINT IF EXISTS "FK_c3b93ceba889c7bb9319d0b9e41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "FK_f48a5f46db8d13a0c8dad0a435d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_f32b1cb14a9920477bcfd63df2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_types" DROP CONSTRAINT IF EXISTS "FK_f7f8f69705cda5be450b48027f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP CONSTRAINT IF EXISTS "FK_88a24953b7fb00e52d96fc1e2ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" DROP COLUMN IF EXISTS "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN IF EXISTS "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_types" DROP COLUMN IF EXISTS "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN IF EXISTS "created_by"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "created_by" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_types" ADD "created_by" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "created_by" uuid`);
    await queryRunner.query(`ALTER TABLE "clients" ADD "created_by" uuid`);
    await queryRunner.query(
      `ALTER TABLE "loans" ADD "created_by" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD CONSTRAINT "FK_88a24953b7fb00e52d96fc1e2ba" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_types" ADD CONSTRAINT "FK_f7f8f69705cda5be450b48027f4" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_f48a5f46db8d13a0c8dad0a435d" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" ADD CONSTRAINT "FK_c3b93ceba889c7bb9319d0b9e41" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
