import { Repository } from 'typeorm';
import { Client } from '../../client/infrastructure/entity/client.entity';
import { User } from '../../identity/infrastructure/entity/user.entity';
import { Organization } from '../../organization/infrastructure/entity/organization.entity';
import { UserRole } from '../../shared/enums/user-role.enum';
import { HashService } from '../hash/hash.service';
import { faker } from '@faker-js/faker';
import { EmploymentStatus } from '../../shared/enums/employment-status.enum';

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
      documentNumber: faker.string.numeric(8),
      phone: faker.phone.number(),
      email: faker.internet.email().toLowerCase(),
      address: faker.location.streetAddress(),
      birthDate: faker.date.past({ years: 30, refDate: new Date() }), // Añadido birthDate
      employmentStatus: faker.helpers.arrayElement(Object.values(EmploymentStatus)), // Añadido employmentStatus
    }));

    const clients = [];

    for (const data of clientsData) {
      // No es necesario verificar el usuario por documentNumber aquí ya que documentNumber ahora está en Client
      // La unicidad del documentNumber se manejará al crear el cliente.

      let clientUser: User;

      // Verificar si ya existe un usuario con este email
      let existingUser = await userRepository.findOne({
        where: { email: data.email }
      });

      if (existingUser) {
        clientUser = existingUser;
      } else {
        // Crear el usuario con rol CLIENT
        const hashedPassword = await this.hashService.hash('123456'); // Contraseña por defecto
        const userFirstName = faker.person.firstName(); // Generar firstName aquí
        const userLastName = faker.person.lastName();   // Generar lastName aquí
        
        clientUser = await userRepository.save(userRepository.create({
          email: data.email,
          password: hashedPassword,
          role: UserRole.CLIENT,
          firstName: userFirstName, // Usar el generado
          lastName: userLastName,   // Usar el generado
          isActive: true,
        }));
      }

      // Verificar si ya existe un cliente para este usuario
      let existingClient = await clientRepository.findOne({
        where: { user: { id: clientUser.id } } // Usar la relación de usuario
      });

      if (existingClient) {
        clients.push(existingClient);
        continue;
      }

      // Crear el registro de cliente asociado al usuario (solo info de crédito)
      const client = await clientRepository.save(clientRepository.create({
        user: clientUser, // Asociar el usuario
        organization: defaultOrganization, // Asociar la organización
        creator: adminUser, // El administrador es el creador
        documentNumber: data.documentNumber,
        phoneNumber: data.phone,
        address: data.address,
        birthDate: data.birthDate,
        employmentStatus: data.employmentStatus,
        isActive: true,
      }));

      clients.push(client);
    }

    console.log('✅ Seeders de clients ejecutados con éxito');
    return clients;
  }
} 