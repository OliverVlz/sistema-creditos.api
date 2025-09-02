import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { DomainError } from 'src/shared/domain';

type CreateCustomer= {
  fullName: string;
  documentNumber: string;
  phone?: string;
  address?: string;
};

type CustomerFilters = {
  terms?: string;
  cursor?: string;
  size?: number;
};

type CustomerSelect = { [key in keyof Customer]?: boolean };

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(customer: CreateCustomer) {
    const createdCustomer = this.customersRepository.create(customer);
    return this.customersRepository.save(createdCustomer);
  }

  async searchCustomers(filters: CustomerFilters, select?: CustomerSelect) {
    const queryBuilder = this.customersRepository.createQueryBuilder('customer');

    if (select) {
      const selectedFields = Object.keys(select)
        .filter(key => select[key])
        .map(key => `customer.${key}`);
      queryBuilder.select(selectedFields);
    }

    if (filters.terms) {
      const term = filters.terms.toLowerCase().trim();

      queryBuilder
        .andWhere(`(LOWER(customer.fullName) LIKE :term OR LOWER(customer.documentNumber) LIKE :term OR LOWER(customer.phone) LIKE :term)`,
          { term: `%${term}%` },
        )
        .addSelect(
          `CASE
            WHEN LOWER(customer.fullName) = :exactTerm OR LOWER(customer.documentNumber) = :exactTerm THEN 1
            WHEN LOWER(customer.fullName) LIKE :startsWithTerm OR LOWER(customer.documentNumber) LIKE :startsWithTerm THEN 2
            ELSE 3
          END`,
          'relevance',
        )
        .orderBy('relevance', 'ASC')
        .addOrderBy('customer.createdAt', 'DESC')
        .setParameters({
          exactTerm: term,
          startsWithTerm: `${term}%`,
        });
    } else {
      queryBuilder.orderBy('customer.createdAt', 'DESC');
    }

    if (filters.cursor) {
      queryBuilder.andWhere('customer.id > :cursor', { cursor: filters.cursor });
    }

    if (filters.size) {
      queryBuilder.limit(filters.size);
    }

    const customers = await queryBuilder.getMany();

    return {
      customers,
      cursor: customers.length > 0 ? customers[customers.length - 1].id : undefined,
    };
  }

  async findAll() {
    const customers = await this.customersRepository.find({
      order: { createdAt: 'DESC' },
    });
    return customers;
  }

  async findOne(id: number) {
    const customer = await this.customersRepository.findOne({ where: { id } });
    if (!customer) {
      throw new DomainError('CUSTOMER_NOT_FOUND', 'Customer not found');
    }
    return customer;
  }

  async update(id: number, customer: Partial<CreateCustomer>) {
    await this.customersRepository.update(id, customer);
    return this.findOne(id);
  }

  async remove(id: number) {
    const deleteResult = await this.customersRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new DomainError('CUSTOMER_NOT_FOUND', 'Customer not found');
    }
  }

  async findByDocumentNumber(documentNumber: string) {
    const customer = await this.customersRepository.findOne({ where: { documentNumber } });
    return customer;
  }
} 