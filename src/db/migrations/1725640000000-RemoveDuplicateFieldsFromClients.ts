import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDuplicateFieldsFromClients1725640000000 implements MigrationInterface {
    name = 'RemoveDuplicateFieldsFromClients1725640000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Eliminar las columnas first_name y last_name de la tabla clients
        // ya que ahora la información del nombre viene del User relacionado
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "first_name"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "last_name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recrear las columnas en caso de rollback
        await queryRunner.query(`ALTER TABLE "clients" ADD "first_name" character varying`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "last_name" character varying`);
    }
}
