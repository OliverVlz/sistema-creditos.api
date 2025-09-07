import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveDocumentNumberToUsers1725642000000 implements MigrationInterface {
    name = 'MoveDocumentNumberToUsers1725642000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Añadir document_number a users
        await queryRunner.query(`ALTER TABLE "users" ADD "document_number" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_users_document_number" UNIQUE ("document_number")`);

        // Migrar datos existentes de clients a users
        await queryRunner.query(`
            UPDATE "users" 
            SET "document_number" = c."document_number"
            FROM "clients" c 
            WHERE "users"."id" = c."user_id"
        `);

        // Eliminar document_number de clients
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "UQ_clients_document_number"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "document_number"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Añadir document_number de vuelta a clients
        await queryRunner.query(`ALTER TABLE "clients" ADD "document_number" character varying`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "UQ_clients_document_number" UNIQUE ("document_number")`);

        // Migrar datos de vuelta de users a clients
        await queryRunner.query(`
            UPDATE "clients" 
            SET "document_number" = u."document_number"
            FROM "users" u 
            WHERE "clients"."user_id" = u."id"
        `);

        // Remover document_number de users
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_users_document_number"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "document_number"`);
    }
}
