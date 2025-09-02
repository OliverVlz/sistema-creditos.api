import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { HashService } from 'src/shared/hash/hash.service';
import { UserRole } from 'src/shared/enums';

export class UserSeeder {
  constructor(private readonly hashService: HashService) {}

  async seed(userRepository: Repository<User>) {
    const existingAdmin = await userRepository.findOne({ where: { email: 'admin@dev.com' } });

    if (!existingAdmin) {
      const hashedPassword = await this.hashService.hash('Admin123!');

      const adminUser = userRepository.create(
        {
          email: 'admin@dev.com',
          password: hashedPassword,
          profile: {
            firstName: 'Admin',
            lastName: faker.person.lastName(),
            address: { street: faker.location.streetAddress() },
            avatarUrl: faker.image.avatar(),
          },
          role: UserRole.Admin,
          language: faker.helpers.arrayElement(['es', 'en']),
        } as Partial<User>
      );
      await userRepository.save(adminUser);
      console.log('✅ Usuario administrador sembrado con éxito');
    } else {
      console.log('⏩ Usuario administrador ya existe, omitiendo siembra.');
    }
  }
}
