import { Repository } from 'typeorm';
import { Customer } from '../../customer/infrastructure/entity/customer.entity';
import { faker } from '@faker-js/faker';

export class CustomerSeeder {
  async seed(customerRepository: Repository<Customer>) {
    const customersData = Array.from({ length: 10 }).map(() => ({
      fullName: faker.person.fullName(),
      documentNumber: faker.string.numeric(8),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
    }));

    const customers = await Promise.all(
      customersData.map(async data => {
        let customer = await customerRepository.findOne({
          where: { documentNumber: data.documentNumber }
        });
        if (!customer) {
          customer = await customerRepository.save(customerRepository.create(data));
        }
        return customer;
      }),
    );

    console.log('✅ Seeders de customers ejecutados con éxito');
    return customers;
  }
} 