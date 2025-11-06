import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEmploymentStatusOther1730919600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna employment_status_other de la tabla clients
    await queryRunner.query(
      `ALTER TABLE "clients" DROP COLUMN IF EXISTS "employment_status_other"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: volver a agregar la columna
    await queryRunner.query(
      `ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "employment_status_other" VARCHAR`,
    );
  }
}
