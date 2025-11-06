import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOtroFromEmploymentStatusEnum1730920100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no permite eliminar valores de un enum directamente
    // Necesitamos recrear el enum

    // 1. Crear un nuevo enum temporal sin OTRO
    await queryRunner.query(`
      CREATE TYPE "clients_employment_status_enum_new" AS ENUM ('ACTIVO', 'JUBILADO')
    `);

    // 2. Cambiar la columna al nuevo enum
    await queryRunner.query(`
      ALTER TABLE "clients" 
      ALTER COLUMN "employment_status" TYPE "clients_employment_status_enum_new" 
      USING "employment_status"::text::"clients_employment_status_enum_new"
    `);

    // 3. Eliminar el enum viejo
    await queryRunner.query(`
      DROP TYPE "clients_employment_status_enum"
    `);

    // 4. Renombrar el nuevo enum
    await queryRunner.query(`
      ALTER TYPE "clients_employment_status_enum_new" RENAME TO "clients_employment_status_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir: agregar OTRO de vuelta al enum
    await queryRunner.query(`
      CREATE TYPE "clients_employment_status_enum_new" AS ENUM ('ACTIVO', 'JUBILADO', 'OTRO')
    `);

    await queryRunner.query(`
      ALTER TABLE "clients" 
      ALTER COLUMN "employment_status" TYPE "clients_employment_status_enum_new" 
      USING "employment_status"::text::"clients_employment_status_enum_new"
    `);

    await queryRunner.query(`
      DROP TYPE "clients_employment_status_enum"
    `);

    await queryRunner.query(`
      ALTER TYPE "clients_employment_status_enum_new" RENAME TO "clients_employment_status_enum"
    `);
  }
}
