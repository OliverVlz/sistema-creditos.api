import { DataSource } from 'typeorm';
import dataSource from 'src/db/data-source';

import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { LoanType } from 'src/loan-type/infrastructure/entity/loan-type.entity';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';
import { HashService } from 'src/shared/hash/hash.service';

import { UserSeeder } from '../seed/user.seeder';
import { OrganizationSeeder } from '../seed/organization.seeder';
import { ClientSeeder } from '../seed/client.seeder';
import { LoanTypeSeeder } from '../seed/loan-type.seeder';
import { DocumentTypeSeeder } from '../seed/document-type.seeder';

async function checkTablesExist(dataSource: DataSource): Promise<boolean> {
  try {
    const result = await dataSource.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );`,
    );
    return result[0]?.exists === true;
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

    if (!tablesExist) {
      console.log('📦 Tablas no encontradas - creando esquema inicial...\n');
      const syncDataSource = new DataSource({
        ...dataSource.options,
        synchronize: true,
        migrationsRun: false,
      });
      await syncDataSource.initialize();
      await syncDataSource.destroy();
      console.log('✅ Esquema inicial creado\n');
    }

    await tempDataSource.destroy();

    finalDataSource = new DataSource({
      ...dataSource.options,
      synchronize: false,
      migrationsRun: tablesExist,
    });

    await finalDataSource.initialize();

    if (tablesExist) {
      console.log('🔄 Migraciones ejecutadas automáticamente\n');
    }

    const userRepository = finalDataSource.getRepository(User);
    const organizationRepository = finalDataSource.getRepository(Organization);
    const clientRepository = finalDataSource.getRepository(Client);
    const loanTypeRepository = finalDataSource.getRepository(LoanType);
    const documentTypeRepository = finalDataSource.getRepository(DocumentType);

    const hashService = new HashService();

    console.log('1️⃣ Sembrando usuarios...');
    await new UserSeeder(hashService).seed(userRepository);

    console.log('\n2️⃣ Sembrando organizaciones...');
    await new OrganizationSeeder().seed(organizationRepository);

    console.log('\n3️⃣ Sembrando tipos de préstamo...');
    await new LoanTypeSeeder().seed(loanTypeRepository);

    console.log('\n4️⃣ Sembrando clientes...');
    await new ClientSeeder(hashService).seed(
      clientRepository,
      userRepository,
      organizationRepository,
    );

    console.log('\n5️⃣ Sembrando tipos de documento...');
    await new DocumentTypeSeeder().seed(documentTypeRepository);

    console.log('\n🎉 Todos los seeders ejecutados correctamente!');
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
