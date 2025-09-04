import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { GetUsersQuery } from './get-users.query';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery) {
    return this.userRepository.searchUsersWithPagination(query);
  }
}