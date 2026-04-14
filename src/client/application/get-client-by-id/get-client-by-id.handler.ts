import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetClientByIdQuery } from './get-client-by-id.query';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { User } from 'src/identity/domain/user.model';
import { formatYmdUtc } from 'src/shared/utils/date-only';

@QueryHandler(GetClientByIdQuery)
export class GetClientByIdHandler implements IQueryHandler<GetClientByIdQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetClientByIdQuery) {
    const client = await this.clientRepository.findOneByUserIdWithLoans(
      query.userId,
    );

    if (!client) return null;

    return {
      ...User.fromModel(client.user).getUserInfo(),
      clientInfo: {
        id: client.id,
        employmentStatus: client.employmentStatus,
        address: client.address,
        birthDate: client.birthDate
          ? client.birthDate instanceof Date
            ? formatYmdUtc(client.birthDate)
            : String(client.birthDate).split('T')[0]
          : null,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        organization: client.organization
          ? {
              ...client.organization,
            }
          : null,
        updater: client.user.updater
          ? User.fromModel(client.user.updater).getUserInfo()
          : null,
        loans:
          client.loans?.map(loan => ({
            ...loan,
            loanType: loan.loanType
              ? {
                  id: loan.loanType.id,
                  name: loan.loanType.name,
                }
              : undefined,
            organization: loan.organization
              ? {
                  id: loan.organization.id,
                  name: loan.organization.name,
                }
              : undefined,
          })) || [],
      },
    };
  }
}
