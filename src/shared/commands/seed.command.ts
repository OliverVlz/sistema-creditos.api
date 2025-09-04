import dataSource from 'src/db/data-source';

import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { HashService } from 'src/shared/hash/hash.service';

import { ClientSeeder } from '../seed/client.seeder';
import { UserSeeder } from '../seed/user.seeder';

async function bootstrap() {
  try {
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const clientRepository = dataSource.getRepository(Client);

    const hashService = new HashService();
    const clientSeeder = new ClientSeeder();
    const userSeeder = new UserSeeder(hashService);

    await clientSeeder.seed(clientRepository);
    await userSeeder.seed(userRepository);
  } catch (error) {
    console.error('Error ejecutando seeders:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

bootstrap();
