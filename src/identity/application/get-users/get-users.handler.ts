import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from 'src/identity/domain/user.model';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { GetUsersQuery } from './get-users.query';
import { PaginationUtils } from 'src/shared/utils';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery) {
    // Si se especifica page o limit, usar paginación
    if (query.page !== undefined || query.limit !== undefined) {
      const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
        query.page,
        query.limit,
      );

      const searchResult = await this.userRepository.searchUsersWithPagination({
        role: query.role,
        terms: query.terms,
        limit: paginationOptions.limit,
        offset: paginationOptions.offset,
      });
      
      const usersInfo = searchResult.users.map(user => User.fromModel(user).getUserInfo());
      
      return PaginationUtils.createPaginatedResult(
        { data: usersInfo, total: searchResult.total },
        paginationOptions,
      );
    }

    // Legacy: Sin paginación
    const users = await this.userRepository.findUsers(query.role, query.terms);
    return users.map(user => User.fromModel(user).getUserInfo());
  }
} 