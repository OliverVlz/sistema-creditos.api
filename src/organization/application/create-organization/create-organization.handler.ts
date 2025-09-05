import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateOrganizationCommand } from './create-organization.command';
import { OrganizationRepository } from '../../infrastructure/repositories/organization.repository';
import { Organization } from '../../infrastructure/entity/organization.entity';

@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationHandler implements ICommandHandler<CreateOrganizationCommand> {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(command: CreateOrganizationCommand): Promise<Organization> {
    const organizationData = {
      name: command.name,
      description: command.description,
      baseInterestRate: command.baseInterestRate,
      discountRate: command.discountRate,
      taxRate: command.taxRate,
      createdBy: command.createdBy,
    };

    return this.organizationRepository.create(organizationData);
  }
}
