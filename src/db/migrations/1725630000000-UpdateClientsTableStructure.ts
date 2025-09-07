import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class UpdateClientsTableStructure1725630000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si existe la tabla clients
    const table = await queryRunner.getTable('clients');
    if (!table) {
      return;
    }

    // Crear tabla temporal para migración
    await queryRunner.createTable(
      new Table({
        name: 'clients_new',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'first_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'document_number',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'organization_id',
            type: 'uuid',
          },
          {
            name: 'created_by',
            type: 'uuid',
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Migrar datos de la tabla antigua a la nueva
    // Primero necesitamos crear un usuario por defecto para el created_by y una organización por defecto
    const defaultOrgExists = await queryRunner.query(`
      SELECT id FROM organizations LIMIT 1
    `);

    let defaultOrgId: string;
    if (defaultOrgExists.length === 0) {
      // Crear organización por defecto
      const orgResult = await queryRunner.query(`
        INSERT INTO organizations (name, description, base_interest_rate, discount_rate, tax_rate, created_by, is_active)
        VALUES ('Organización por Defecto', 'Organización creada durante migración', 12.00, 0.00, 0.00, uuid_generate_v4(), true)
        RETURNING id
      `);
      defaultOrgId = orgResult[0].id;
    } else {
      defaultOrgId = defaultOrgExists[0].id;
    }

    // Verificar si existe la tabla users y tiene registros
    const defaultUserExists = await queryRunner.query(`
      SELECT id FROM users LIMIT 1
    `);

    let defaultUserId: string;
    if (defaultUserExists.length === 0) {
      // Crear usuario por defecto si no existe
      const userResult = await queryRunner.query(`
        INSERT INTO users (email, password, role, profile, "isActive")
        VALUES ('admin@sistema.com', '$2b$10$dummy.hash.for.migration', 'ADMIN', '{"firstName": "Admin", "lastName": "Sistema"}', true)
        RETURNING id
      `);
      defaultUserId = userResult[0].id;
    } else {
      defaultUserId = defaultUserExists[0].id;
    }

    // Migrar datos existentes
    await queryRunner.query(`
      INSERT INTO clients_new (first_name, last_name, document_number, phone, address, organization_id, created_by, is_active, created_at, updated_at)
      SELECT 
        COALESCE(SPLIT_PART(COALESCE("fullName", ''), ' ', 1), 'Sin nombre') as first_name,
        COALESCE(SUBSTRING("fullName" FROM POSITION(' ' IN COALESCE("fullName", '')) + 1), 'Sin apellido') as last_name,
        COALESCE("documentNumber", 'DOC-' || id::text) as document_number,
        phone,
        address,
        '${defaultOrgId}' as organization_id,
        '${defaultUserId}' as created_by,
        true as is_active,
        COALESCE("createdAt", CURRENT_TIMESTAMP) as created_at,
        COALESCE("updatedAt", CURRENT_TIMESTAMP) as updated_at
      FROM clients
    `);

    // Eliminar tabla antigua
    await queryRunner.dropTable('clients');

    // Renombrar tabla nueva
    await queryRunner.renameTable('clients_new', 'clients');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clients');
    if (!table) {
      return;
    }

    // Crear tabla con estructura antigua
    await queryRunner.createTable(
      new Table({
        name: 'clients_old',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'fullName',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'documentNumber',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'phone',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    // Migrar datos de vuelta
    await queryRunner.query(`
      INSERT INTO clients_old ("fullName", "documentNumber", phone, address, "createdAt", "updatedAt")
      SELECT 
        CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as "fullName",
        document_number as "documentNumber",
        phone,
        address,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM clients
    `);

    // Eliminar tabla nueva
    await queryRunner.dropTable('clients');

    // Renombrar tabla antigua
    await queryRunner.renameTable('clients_old', 'clients');
  }
}
