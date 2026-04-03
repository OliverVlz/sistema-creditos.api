import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUpdaterToUserEntity1763000733277 implements MigrationInterface {
  name = 'AddUpdaterToUserEntity1763000733277';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCreatedBy = await queryRunner.hasColumn('users', 'createdBy');
    const hasUpdatedBy = await queryRunner.hasColumn('users', 'updated_by');

    if (hasCreatedBy && !hasUpdatedBy) {
      await queryRunner.query(
        `ALTER TABLE "users" RENAME COLUMN "createdBy" TO "updated_by"`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "updated_by"`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "updated_by" uuid`);

    await queryRunner.query(`
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM pg_constraint
                            WHERE conname = 'FK_b75c92ef36f432fe68ec300a7d4'
                        ) THEN
                            ALTER TABLE "users"
                            ADD CONSTRAINT "FK_b75c92ef36f432fe68ec300a7d4"
                            FOREIGN KEY ("updated_by") REFERENCES "users"("id")
                            ON DELETE NO ACTION ON UPDATE NO ACTION;
                        END IF;
                    END
                    $$;
                `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_b75c92ef36f432fe68ec300a7d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "updated_by"`,
    );

    const hasCreatedBy = await queryRunner.hasColumn('users', 'createdBy');
    if (!hasCreatedBy) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD "createdBy" character varying`,
      );
    }
  }
}
