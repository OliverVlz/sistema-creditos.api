import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { Organization } from './entity/organization.entity';
import { OrganizationsController } from './organization.controller';
import { OrganizationRepository } from './repositories/organization.repository';

import { CreateOrganizationHandler } from '../application/create-organization/create-organization.handler';
import { GetOrganizationsHandler } from '../application/get-organizations/get-organizations.handler';
import { GetOrganizationByIdHandler } from '../application/get-organization-by-id/get-organization-by-id.handler';
import { UpdateOrganizationHandler } from '../application/update-organization/update-organization.handler';
import { DeleteOrganizationHandler } from '../application/delete-organization/delete-organization.handler';

const CommandHandlers = [
  CreateOrganizationHandler,
  UpdateOrganizationHandler,
  DeleteOrganizationHandler,
];

const QueryHandlers = [
  GetOrganizationsHandler,
  GetOrganizationByIdHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    CqrsModule,
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationRepository,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [OrganizationRepository],
})
export class OrganizationModule {}
