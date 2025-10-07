import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersClientInfoQuery } from './get-users-client-info.query';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { User } from 'src/identity/domain/user.model';

@QueryHandler(GetUsersClientInfoQuery)
export class GetUsersClientInfoHandler implements IQueryHandler<GetUsersClientInfoQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetUsersClientInfoQuery) {
    const result = await this.clientRepository.searchClientsWithPagination(query);
    
    const transformedData = result.data.map(client => ({
      ...User.fromModel(client.user).getUserInfo(),
      clientInfo: {
        ...client,
        loans: client.loans?.map(loan => ({
          ...loan,
          loanType: loan.loanType ? { 
            id: loan.loanType.id,
            name: loan.loanType.name 
          } : undefined,
          organization: loan.organization ? {
            id: loan.organization.id,
            name: loan.organization.name
          } : undefined,
        })),
      },
    }));

    return { ...result, data: transformedData };
  }
}