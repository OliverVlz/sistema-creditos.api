import { DataSource } from 'typeorm';
import dataSource from 'src/db/data-source';

import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { LoanType } from 'src/loan-type/infrastructure/entity/loan-type.entity';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';
import { HashService } from 'src/shared/hash/hash.service';

import { UserSeeder } from '../seed/user.seeder';
import { OrganizationSeeder } from '../seed/organization.seeder';
import { LoanTypeSeeder } from '../seed/loan-type.seeder';
import { DocumentTypeSeeder } from '../seed/document-type.seeder';

async function checkTablesExist(dataSource: DataSource): Promise<boolean> {
  try {
    const result = await dataSource.query(
      `SELECT COUNT(*) as count
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN ('users', 'clients', 'organizations');`,
    );
    const count = parseInt(result[0]?.count || '0', 10);
    return count >= 3;
  } catch {
    return false;
  }
}

async function bootstrap() {
  console.log('🌱 Iniciando seeders...\n');

  let finalDataSource: DataSource | null = null;

  try {
    const tempDataSource = new DataSource({
      ...dataSource.options,
      synchronize: false,
      migrationsRun: false,
    });

    await tempDataSource.initialize();
    console.log('✅ Conexión a base de datos establecida\n');

    const tablesExist = await checkTablesExist(tempDataSource);
    console.log(
      `🔍 Verificación: tablas de aplicación ${tablesExist ? 'existen' : 'NO existen'}\n`,
    );

    if (!tablesExist) {
      console.log('📦 Tablas no encontradas - creando esquema inicial...\n');
      await tempDataSource.destroy();

      finalDataSource = new DataSource({
        ...dataSource.options,
        synchronize: true,
        migrationsRun: false,
      });
      await finalDataSource.initialize();

      await finalDataSource.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          timestamp BIGINT NOT NULL,
          name VARCHAR NOT NULL
        );
      `);

      const migrations = finalDataSource.migrations || [];
      for (const migration of migrations) {
        const timestampMatch = migration.name.match(/^(\d+)/);
        if (timestampMatch) {
          const timestamp = parseInt(timestampMatch[1], 10);
          try {
            await finalDataSource.query(
              `INSERT INTO migrations (timestamp, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [timestamp, migration.name],
            );
          } catch {}
        }
      }
      console.log(
        `✅ ${migrations.length} migraciones marcadas como ejecutadas\n`,
      );
      console.log('✅ Esquema inicial creado\n');
    } else {
      await tempDataSource.destroy();

      finalDataSource = new DataSource({
        ...dataSource.options,
        synchronize: false,
        migrationsRun: false,
      });

      await finalDataSource.initialize();

      console.log('🔄 Ejecutando migraciones pendientes...\n');
      await finalDataSource.runMigrations();
      console.log('✅ Migraciones ejecutadas\n');
    }

    const skipSeeders = process.env.SKIP_SEEDERS === 'true';

    if (skipSeeders) {
      console.log('⏭️  SKIP_SEEDERS activado - omitiendo seeders\n');
      console.log('✅ Esquema de base de datos listo');
    } else {
      const userRepository = finalDataSource.getRepository(User);
      const organizationRepository =
        finalDataSource.getRepository(Organization);
      const loanTypeRepository = finalDataSource.getRepository(LoanType);
      const documentTypeRepository =
        finalDataSource.getRepository(DocumentType);

      const hashService = new HashService();

      console.log('1️⃣ Sembrando usuarios...');
      await new UserSeeder(hashService).seed(userRepository);

      console.log('\n2️⃣ Sembrando organizaciones...');
      await new OrganizationSeeder().seed(organizationRepository);

      console.log('\n3️⃣ Sembrando tipos de préstamo...');
      await new LoanTypeSeeder().seed(loanTypeRepository);

      console.log('\n4️⃣ Sembrando tipos de documento...');
      await new DocumentTypeSeeder().seed(documentTypeRepository);

      console.log('\n🎉 Todos los seeders ejecutados correctamente!');
    }
  } catch (error) {
    console.error('\n❌ Error ejecutando seeders:', error);
    process.exit(1);
  } finally {
    if (finalDataSource?.isInitialized) {
      await finalDataSource.destroy();
      console.log('\n🔌 Conexión a base de datos cerrada');
    }
  }
}

bootstrap();
