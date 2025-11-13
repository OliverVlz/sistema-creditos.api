import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { User } from 'src/identity/domain/user.model';
import { DomainError } from 'src/shared/domain';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserByIdQuery) {
    const user = await this.userRepository.findById(query.userId);
    if (!user) throw new DomainError('USER_NOT_FOUND', 'User not found');
    return User.fromModel(user).getUserInfo();
  }
}
