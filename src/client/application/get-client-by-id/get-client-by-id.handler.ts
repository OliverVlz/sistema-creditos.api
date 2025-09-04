import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { GetClientByIdQuery } from './get-client-by-id.query';

@QueryHandler(GetClientByIdQuery)
export class GetClientByIdHandler implements IQueryHandler<GetClientByIdQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetClientByIdQuery) {
    return this.clientRepository.findOne(query.id);
  }
}
