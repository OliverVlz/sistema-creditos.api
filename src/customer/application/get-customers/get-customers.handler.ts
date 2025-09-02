import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCustomersQuery } from './get-customers.query';
import { CustomerRepository } from '../../infrastructure/repositories/customer.repository';

@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler implements IQueryHandler<GetCustomersQuery> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(query: GetCustomersQuery) {
    const pageSize = 10;
    const result = await this.customerRepository.searchCustomers({
      ...query,
      size: query.size || pageSize,
    });
    return result;
  }
} 