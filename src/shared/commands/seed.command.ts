import dataSource from 'src/db/data-source';

import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { HashService } from 'src/shared/hash/hash.service';

import { ClientSeeder } from '../seed/client.seeder';
import { UserSeeder } from '../seed/user.seeder';
import { OrganizationSeeder } from '../seed/organization.seeder';
import { LoanTypeSeeder } from '../seed/loan-type.seeder';
import { LoanType } from 'src/loan-type/infrastructure/entity/loan-type.entity';

async function bootstrap() {
  try {
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const clientRepository = dataSource.getRepository(Client);
    const organizationRepository = dataSource.getRepository(Organization);
    const loanTypeRepository = dataSource.getRepository(LoanType);

    const hashService = new HashService();
    const userSeeder = new UserSeeder(hashService);
    const organizationSeeder = new OrganizationSeeder();
    const clientSeeder = new ClientSeeder(hashService);
    const loanTypeSeeder = new LoanTypeSeeder();
    // Ejecutar seeders en orden: usuarios primero, luego organizaciones, luego clientes
    await userSeeder.seed(userRepository);
    await organizationSeeder.seed(organizationRepository, userRepository);
    await clientSeeder.seed(clientRepository, userRepository, organizationRepository);
    await loanTypeSeeder.seed(loanTypeRepository, organizationRepository);
  } catch (error) {
    console.error('Error ejecutando seeders:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

bootstrap();
