import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersClientInfoByIdQuery } from './get-users-client-info-by-id.query';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { User } from 'src/identity/domain/user.model';

@QueryHandler(GetUsersClientInfoByIdQuery)
export class GetUsersClientInfoByIdHandler implements IQueryHandler<GetUsersClientInfoByIdQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetUsersClientInfoByIdQuery) {
    const client = await this.clientRepository.findOneByUserIdWithLoans(query.userId);

    if (!client) return null;

    return {
      ...User.fromModel(client.user).getUserInfo(),
      clientInfo: {
        ...client,
        loans: client.loans?.map(loan => ({
          ...loan,
          loanType: loan.loanType ? {
            id: loan.loanType.id,
            name: loan.loanType.name,
          } : undefined,
          organization: loan.organization ? {
            id: loan.organization.id,
            name: loan.organization.name,
          } : undefined,
        })),
      },
    };
  }
}