import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetOrganizationsQuery } from './get-organizations.query';
import { OrganizationRepository } from '../../infrastructure/repositories/organization.repository';

@QueryHandler(GetOrganizationsQuery)
export class GetOrganizationsHandler implements IQueryHandler<GetOrganizationsQuery> {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(query: GetOrganizationsQuery) {
    return this.organizationRepository.searchOrganizationsWithPagination(query);
  }
}
