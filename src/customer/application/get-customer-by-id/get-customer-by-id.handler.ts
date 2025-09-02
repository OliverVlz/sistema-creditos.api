import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CustomerRepository } from '../../infrastructure/repositories/customer.repository';
import { GetCustomerByIdQuery } from './get-customer-by-id.query';

@QueryHandler(GetCustomerByIdQuery)
export class GetCustomerByIdHandler implements IQueryHandler<GetCustomerByIdQuery> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(query: GetCustomerByIdQuery) {
    return this.customerRepository.findOne(query.id);
  }
} 