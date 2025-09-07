import { Repository } from 'typeorm';
import { Organization } from '../../organization/infrastructure/entity/organization.entity';
import { User } from '../../identity/infrastructure/entity/user.entity';
import { faker } from '@faker-js/faker';

export class OrganizationSeeder {
  async seed(
    organizationRepository: Repository<Organization>,
    userRepository: Repository<User>
  ) {
    // Obtener un usuario existente para usar como creador
    const defaultUser = await userRepository.findOne({ where: {} });

    if (!defaultUser) {
      console.log('⚠️ No se encontró un usuario para crear organizaciones. Ejecuta primero el seeder de usuarios.');
      return [];
    }

    const organizationsData = [
      {
        name: 'Organización Principal',
        description: 'Organización principal del sistema',
        baseInterestRate: 12.0,
        discountRate: 2.0,
        taxRate: 8.0,
        createdBy: defaultUser.id,
      },
      {
        name: 'Cooperativa de Crédito',
        description: 'Cooperativa de ahorro y crédito',
        baseInterestRate: 10.5,
        discountRate: 1.5,
        taxRate: 7.5,
        createdBy: defaultUser.id,
      },
      {
        name: 'Microfinanciera del Norte',
        description: 'Institución microfinanciera especializada',
        baseInterestRate: 15.0,
        discountRate: 3.0,
        taxRate: 10.0,
        createdBy: defaultUser.id,
      }
    ];

    const organizations = await Promise.all(
      organizationsData.map(async data => {
        let organization = await organizationRepository.findOne({
          where: { name: data.name }
        });
        if (!organization) {
          organization = await organizationRepository.save(organizationRepository.create(data));
        }
        return organization;
      }),
    );

    console.log('✅ Seeders de organizations ejecutados con éxito');
    return organizations;
  }
}
