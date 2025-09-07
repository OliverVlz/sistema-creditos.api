import dataSource from 'src/db/data-source';

import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { HashService } from 'src/shared/hash/hash.service';

import { ClientSeeder } from '../seed/client.seeder';
import { UserSeeder } from '../seed/user.seeder';
import { OrganizationSeeder } from '../seed/organization.seeder';

async function bootstrap() {
  try {
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const clientRepository = dataSource.getRepository(Client);
    const organizationRepository = dataSource.getRepository(Organization);

    const hashService = new HashService();
    const userSeeder = new UserSeeder(hashService);
    const organizationSeeder = new OrganizationSeeder();
    const clientSeeder = new ClientSeeder(hashService);

    // Ejecutar seeders en orden: usuarios primero, luego organizaciones, luego clientes
    await userSeeder.seed(userRepository);
    await organizationSeeder.seed(organizationRepository, userRepository);
    await clientSeeder.seed(clientRepository, userRepository, organizationRepository);
  } catch (error) {
    console.error('Error ejecutando seeders:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

bootstrap();
