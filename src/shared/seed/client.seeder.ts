import { Repository } from 'typeorm';
import { Client } from '../../client/infrastructure/entity/client.entity';
import { User } from '../../identity/infrastructure/entity/user.entity';
import { Organization } from '../../organization/infrastructure/entity/organization.entity';
import { UserRole } from '../../shared/enums/user-role.enum';
import { HashService } from '../hash/hash.service';
import { faker } from '@faker-js/faker';

export class ClientSeeder {
  constructor(private readonly hashService: HashService) {}

  async seed(
    clientRepository: Repository<Client>,
    userRepository: Repository<User>,
    organizationRepository: Repository<Organization>
  ) {
    // Obtener un usuario admin y organización existentes para usar como referencias
    const adminUser = await userRepository.findOne({ 
      where: { role: UserRole.ADMIN } 
    });
    const defaultOrganization = await organizationRepository.findOne({ where: {} });

    if (!adminUser) {
      console.log('⚠️ No se encontró un usuario administrador para crear clientes. Ejecuta primero el seeder de usuarios.');
      return [];
    }

    if (!defaultOrganization) {
      console.log('⚠️ No se encontró una organización para crear clientes. Ejecuta primero el seeder de organizaciones.');
      return [];
    }

    const clientsData = Array.from({ length: 10 }).map(() => ({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      documentNumber: faker.string.numeric(8),
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      address: faker.location.streetAddress(),
      creditScore: faker.number.int({ min: 300, max: 850 }),
      maxCreditLimit: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
      riskLevel: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
    }));

    const clients = [];

    for (const data of clientsData) {
      // Verificar si ya existe un usuario con este documento
      let existingUser = await userRepository.findOne({
        where: { documentNumber: data.documentNumber }
      });

      let clientUser: User;

      if (existingUser) {
        clientUser = existingUser;
      } else {
        // Crear el usuario con rol CLIENT
        const hashedPassword = await this.hashService.hash('123456'); // Contraseña por defecto
        
        clientUser = await userRepository.save(userRepository.create({
          email: data.email,
          password: hashedPassword,
          role: UserRole.CLIENT,
          documentNumber: data.documentNumber, // Ahora está en User
          profile: {
            firstName: data.firstName,
            lastName: data.lastName,
            address: { street: data.address },
            avatarUrl: faker.image.avatar(),
          },
          phone: data.phone,
          isActive: true,
        }));
      }

      // Verificar si ya existe un cliente para este usuario
      let existingClient = await clientRepository.findOne({
        where: { userId: clientUser.id }
      });

      if (existingClient) {
        clients.push(existingClient);
        continue;
      }

      // Crear el registro de cliente asociado al usuario (solo info de crédito)
      const client = await clientRepository.save(clientRepository.create({
        userId: clientUser.id,
        organizationId: defaultOrganization.id,
        createdBy: adminUser.id,
        creditScore: data.creditScore,
        maxCreditLimit: data.maxCreditLimit,
        riskLevel: data.riskLevel,
      }));

      clients.push(client);
    }

    console.log('✅ Seeders de clients ejecutados con éxito');
    return clients;
  }
} 