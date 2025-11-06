import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUsersClientInfoQuery } from './get-users-client-info.query';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';

@QueryHandler(GetUsersClientInfoQuery)
export class GetUsersClientInfoHandler
  implements IQueryHandler<GetUsersClientInfoQuery>
{
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetUsersClientInfoQuery) {
    const result = await this.clientRepository.searchClientsForListView({
      page: query.page,
      limit: query.limit,
      terms: query.terms,
      organizationId: query.organizationId,
    });

    const transformedData = result.data.map(client => ({
      id: client.id,
      isActive: client.isActive,
      fullName: `${client.user.firstName} ${client.user.lastName}`.trim(),
      documentNumber: client.user.documentNumber,
      email: client.user.email,
      phoneNumber: client.user.phoneNumber,
      organization: {
        name: client.organization?.name || 'Sin organización',
      },
      employmentStatus: client.employmentStatus,
      createdAt: client.createdAt,
      createdBy: client.creator
        ? `${client.creator.firstName} ${client.creator.lastName}`.trim()
        : null,
    }));

    return { ...result, data: transformedData };
  }
}
