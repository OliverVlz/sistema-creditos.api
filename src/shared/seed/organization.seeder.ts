import { Repository } from 'typeorm';
import { Organization } from '../../organization/infrastructure/entity/organization.entity';

const ORGANIZATIONS_DATA = [
  {
    name: 'Policía Nacional',
    description: 'Fuerza pública encargada de la seguridad ciudadana',
  },
  {
    name: 'Ejército Nacional',
    description: 'Fuerza militar terrestre de Colombia',
  },
  {
    name: 'Armada Nacional',
    description: 'Fuerza militar naval de Colombia',
  },
  {
    name: 'Fuerza Aeroespacial',
    description: 'Fuerza militar aérea de Colombia',
  },
];

export class OrganizationSeeder {
  async seed(organizationRepository: Repository<Organization>) {
    const organizations: Organization[] = [];

    for (const data of ORGANIZATIONS_DATA) {
      let organization = await organizationRepository.findOne({
        where: { name: data.name },
      });

      if (!organization) {
        organization = await organizationRepository.save(
          organizationRepository.create(data),
        );
        console.log(`  ✓ Organización "${data.name}" creada`);
      }

      organizations.push(organization);
    }

    console.log(
      `✅ Seeders de organizaciones ejecutados: ${organizations.length} organizaciones`,
    );
    return organizations;
  }
}
