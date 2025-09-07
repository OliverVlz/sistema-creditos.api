import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditFieldsToClients1725641000000 implements MigrationInterface {
    name = 'AddCreditFieldsToClients1725641000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Añadir campos específicos del dominio de créditos
        await queryRunner.query(`ALTER TABLE "clients" ADD "credit_score" integer`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "max_credit_limit" decimal(10,2)`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "risk_level" character varying`);
        
        // Eliminar campos que ahora están en User
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "phone"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "email"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "address"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover campos específicos de crédito
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "credit_score"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "max_credit_limit"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "risk_level"`);
        
        // Restaurar campos originales
        await queryRunner.query(`ALTER TABLE "clients" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "email" character varying`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "address" character varying`);
    }
}
