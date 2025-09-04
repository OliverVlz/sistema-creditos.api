import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetClientsQuery } from './get-clients.query';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { PaginationUtils } from 'src/shared/utils';

@QueryHandler(GetClientsQuery)
export class GetClientsHandler implements IQueryHandler<GetClientsQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetClientsQuery) {
    // Si usa el nuevo sistema de paginación (page/limit)
    if (query.page !== undefined || query.limit !== undefined) {
      const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
        query.page,
        query.limit,
      );

      const searchResult = await this.clientRepository.searchClientsWithPagination({
        terms: query.terms,
        limit: paginationOptions.limit,
        offset: paginationOptions.offset,
      });
      
      return PaginationUtils.createPaginatedResult(
        { data: searchResult.clients, total: searchResult.total },
        paginationOptions,
      );
    }

    // Legacy cursor-based pagination (mantener compatibilidad)
    const pageSize = 10;
    const result = await this.clientRepository.searchClients({
      terms: query.terms,
      cursor: query.cursor,
      size: query.size || pageSize,
    });
    
    return result;
  }
}
