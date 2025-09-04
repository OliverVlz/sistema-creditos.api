import { Repository } from 'typeorm';
import { Client } from '../../client/infrastructure/entity/client.entity';
import { faker } from '@faker-js/faker';

export class ClientSeeder {
  async seed(clientRepository: Repository<Client>) {
    const clientsData = Array.from({ length: 10 }).map(() => ({
      fullName: faker.person.fullName(),
      documentNumber: faker.string.numeric(8),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
    }));

    const clients = await Promise.all(
      clientsData.map(async data => {
        let client = await clientRepository.findOne({
          where: { documentNumber: data.documentNumber }
        });
        if (!client) {
          client = await clientRepository.save(clientRepository.create(data));
        }
        return client;
      }),
    );

    console.log('✅ Seeders de clients ejecutados con éxito');
    return clients;
  }
} 