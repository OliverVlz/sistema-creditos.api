import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetClientsQuery } from './get-clients.query';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';

@QueryHandler(GetClientsQuery)
export class GetClientsHandler implements IQueryHandler<GetClientsQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetClientsQuery) {
    return this.clientRepository.searchClientsWithPagination(query);
  }
}
