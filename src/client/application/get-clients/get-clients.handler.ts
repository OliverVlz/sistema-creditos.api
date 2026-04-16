import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetClientsQuery } from './get-clients.query';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { SourceType } from 'src/shared/enums';

@QueryHandler(GetClientsQuery)
export class GetClientsHandler implements IQueryHandler<GetClientsQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetClientsQuery) {
    const result = await this.clientRepository.searchClientsForListView({
      page: query.page,
      limit: query.limit,
      terms: query.terms,
      organizationId: query.organizationId,
      employmentStatus: query.employmentStatus,
      isActive: query.isActive,
      uploadedByExcel: query.uploadedByExcel,
    });

    const transformedData = result.data.map(client => ({
      clientId: client.id,
      userId: client.user.id,
      isActive: client.user.isActive,
      firstName: client.user.firstName,
      lastName: client.user.lastName,
      documentNumber: client.user.documentNumber,
      email: client.user.email,
      phoneNumber: client.user.phoneNumber,
      sourceType: client.user.sourceType,
      uploadedByExcel: client.user.sourceType === SourceType.MASSIVE_IMPORT,
      organization: {
        name: client.organization?.name || 'Sin organización',
      },
      employmentStatus: client.employmentStatus,
      createdAt: client.createdAt,
    }));

    return { ...result, data: transformedData };
  }
}
