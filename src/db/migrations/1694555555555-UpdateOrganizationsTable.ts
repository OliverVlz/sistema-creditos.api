import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateOrganizationsTable1694555555555 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to organizations table
    await queryRunner.addColumns('organizations', [
      new TableColumn({
        name: 'base_interest_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
      }),
      new TableColumn({
        name: 'discount_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
      }),
      new TableColumn({
        name: 'tax_rate',
        type: 'decimal',
        precision: 5,
        scale: 2,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the added columns
    await queryRunner.dropColumns('organizations', [
      'base_interest_rate',
      'discount_rate',
      'tax_rate',
    ]);
  }
}
