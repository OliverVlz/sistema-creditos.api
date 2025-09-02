import dataSource from 'src/db/data-source';

import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Customer } from 'src/customer/infrastructure/entity/customer.entity';
import { HashService } from 'src/shared/hash/hash.service';

import { CustomerSeeder } from '../seed/customer.seeder';
import { UserSeeder } from '../seed/user.seeder';

async function bootstrap() {
  try {
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);
    const customerRepository = dataSource.getRepository(Customer);

    const hashService = new HashService();
    const customerSeeder = new CustomerSeeder();
    const userSeeder = new UserSeeder(hashService);

    await customerSeeder.seed(customerRepository);
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
