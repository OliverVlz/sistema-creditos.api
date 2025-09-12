import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { User } from 'src/identity/domain/user.model';
import { GetUsersClientInfoByIdQuery } from './get-users-client-info-by-id.query';
import { UserRole } from 'src/shared/enums';

@QueryHandler(GetUsersClientInfoByIdQuery)
export class GetUsersClientInfoByIdHandler implements IQueryHandler<GetUsersClientInfoByIdQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersClientInfoByIdQuery) {
    const result = await this.userRepository.searchUsersWithClientInfo({
      userId: query.userId,
      role: UserRole.CLIENT,
      page: 1,
      limit: 1
    });
    
    if (!result.data.length) {
      return null;
    }

    const userWithClient = result.data[0];
    const userInfo = User.fromModel(userWithClient).getUserInfo();
    
    return {
      ...userInfo,
      clientInfo: userWithClient.client ? {
        id: userWithClient.client.id,
        creditScore: userWithClient.client.creditScore,
        maxCreditLimit: userWithClient.client.maxCreditLimit,
        riskLevel: userWithClient.client.riskLevel,
        isActive: userWithClient.client.isActive,
        createdAt: userWithClient.client.createdAt,
        updatedAt: userWithClient.client.updatedAt,
      } : null
    };
  }
}
