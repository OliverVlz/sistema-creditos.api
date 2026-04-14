import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Repository } from 'typeorm';
import { HashService } from 'src/shared/hash/hash.service';
import { UserRole } from 'src/shared/enums';

const profileDefaults = {
  firstName: 'Oliver',
  lastName: 'Murillo',
  documentNumber: '100000001',
  phoneNumber: '+573001000001',
};

function resolveAdminSeed() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Definir SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en el entorno para el seeder de usuario admin.',
    );
  }
  const profile = { ...profileDefaults };
  if (process.env.SEED_ADMIN_FIRST_NAME) {
    profile.firstName = process.env.SEED_ADMIN_FIRST_NAME;
  }
  if (process.env.SEED_ADMIN_LAST_NAME) {
    profile.lastName = process.env.SEED_ADMIN_LAST_NAME;
  }
  if (process.env.SEED_ADMIN_DOCUMENT_NUMBER) {
    profile.documentNumber = process.env.SEED_ADMIN_DOCUMENT_NUMBER;
  }
  if (process.env.SEED_ADMIN_PHONE) {
    profile.phoneNumber = process.env.SEED_ADMIN_PHONE;
  }
  return { email, password, ...profile };
}

export class UserSeeder {
  constructor(private readonly hashService: HashService) {}

  async seed(userRepository: Repository<User>) {
    const admin = resolveAdminSeed();

    const existingAdmin = await userRepository.findOne({
      where: { email: admin.email },
    });

    if (!existingAdmin) {
      const hashedPassword = await this.hashService.hash(admin.password);

      const adminUser = userRepository.create({
        email: admin.email,
        password: hashedPassword,
        firstName: admin.firstName,
        lastName: admin.lastName,
        documentNumber: admin.documentNumber,
        phoneNumber: admin.phoneNumber,
        role: UserRole.ADMIN,
      });
      await userRepository.save(adminUser);
      console.log('✅ Usuario administrador sembrado con éxito');
    } else {
      console.log('⏩ Usuario administrador ya existe, omitiendo siembra.');
    }
  }
}
