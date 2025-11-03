import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { HashService } from 'src/shared/hash/hash.service';
import { UserRole } from 'src/shared/enums';

export class UserSeeder {
  constructor(private readonly hashService: HashService) {}

  async seed(userRepository: Repository<User>) {
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@dev.com' },
    });

    if (!existingAdmin) {
      const hashedPassword = await this.hashService.hash('Admin123!');

      const adminUser = userRepository.create({
        email: 'admin@dev.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: faker.person.lastName(),
        documentNumber: '000000000',
        phoneNumber: '+573000000000',
        role: UserRole.ADMIN,
      });
      await userRepository.save(adminUser);
      console.log('✅ Usuario administrador sembrado con éxito');
    } else {
      console.log('⏩ Usuario administrador ya existe, omitiendo siembra.');
    }
  }
}
