import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateOtroEmploymentStatus1730920000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Actualizar todos los registros con 'OTRO' a 'ACTIVO'
    await queryRunner.query(`
      UPDATE "clients" 
      SET "employment_status" = 'ACTIVO' 
      WHERE "employment_status" = 'OTRO'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No hay forma de revertir esto sin perder información
    // pero dejamos el método por si acaso
    console.log(
      'No se puede revertir la migración de OTRO a ACTIVO sin perder datos',
    );
  }
}
