import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { User } from 'src/identity/domain/user.model';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { GetUsersQuery } from './get-users.query';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery) {
    const users = await this.userRepository.findUsers(query.role);
    return users.map(user => User.fromModel(user).getUserInfo());
  }
} 