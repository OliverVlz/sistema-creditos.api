import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetClientsQuery } from './get-clients.query';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';

@QueryHandler(GetClientsQuery)
export class GetClientsHandler implements IQueryHandler<GetClientsQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetClientsQuery) {
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
