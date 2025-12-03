import dataSource from 'src/db/data-source';

import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { LoanType } from 'src/loan-type/infrastructure/entity/loan-type.entity';
import { HashService } from 'src/shared/hash/hash.service';

import { UserSeeder } from '../seed/user.seeder';
import { OrganizationSeeder } from '../seed/organization.seeder';
import { ClientSeeder } from '../seed/client.seeder';
import { LoanTypeSeeder } from '../seed/loan-type.seeder';

async function bootstrap() {
  console.log('🌱 Iniciando seeders...\n');

  try {
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida\n');

    const userRepository = dataSource.getRepository(User);
    const organizationRepository = dataSource.getRepository(Organization);
    const clientRepository = dataSource.getRepository(Client);
    const loanTypeRepository = dataSource.getRepository(LoanType);

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

    console.log('\n🎉 Todos los seeders ejecutados correctamente!');
  } catch (error) {
    console.error('\n❌ Error ejecutando seeders:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n🔌 Conexión a base de datos cerrada');
    }
  }
}

bootstrap();
