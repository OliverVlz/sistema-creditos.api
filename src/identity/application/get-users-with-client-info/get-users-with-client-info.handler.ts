import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { User } from 'src/identity/domain/user.model';
import { GetUsersWithClientInfoQuery } from './get-users-with-client-info.query';
import { UserRole } from 'src/shared/enums';

@QueryHandler(GetUsersWithClientInfoQuery)
export class GetUsersWithClientInfoHandler implements IQueryHandler<GetUsersWithClientInfoQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUsersWithClientInfoQuery) {
    // ✅ Usar el método que garantiza rol CLIENT
    const secureQuery = {
      ...query,
      role: UserRole.CLIENT 
    };
    
    // Obtener usuarios con información de cliente mediante JOIN
    const result = await this.userRepository.searchUsersWithClientInfo(secureQuery);
    
    // Transformar cada usuario para incluir información de cliente
    const transformedData = result.data.map(userWithClient => {
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
    });

    return {
      ...result,
      data: transformedData,
    };
  }
}
