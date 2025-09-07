import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { User } from 'src/identity/domain/user.model';
import { GetUsersQuery } from './get-users.query';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersQuery) {
    const result = await this.userRepository.searchUsersWithPagination(query);
    
    // Transformar cada usuario para usar getUserInfo() y filtrar datos sensibles
    const transformedData = result.data.map(userEntity => 
      User.fromModel(userEntity).getUserInfo()
    );

    return {
      ...result,
      data: transformedData,
    };
  }
}