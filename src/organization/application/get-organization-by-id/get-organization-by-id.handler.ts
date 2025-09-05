import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OrganizationRepository } from '../../infrastructure/repositories/organization.repository';
import { GetOrganizationByIdQuery } from './get-organization-by-id.query';

@QueryHandler(GetOrganizationByIdQuery)
export class GetOrganizationByIdHandler implements IQueryHandler<GetOrganizationByIdQuery> {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(query: GetOrganizationByIdQuery) {
    return this.organizationRepository.findOne(query.id);
  }
}
