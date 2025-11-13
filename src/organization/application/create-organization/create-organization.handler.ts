import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OrganizationRepository } from '../../infrastructure/repositories/organization.repository';
import { CreateOrganizationCommand } from './create-organization.command';

@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationHandler implements ICommandHandler<CreateOrganizationCommand> {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(command: CreateOrganizationCommand) {
    const { name, baseInterestRate, discountRate, taxRate } = command;

    // Asegúrate de que solo se pasen los campos relevantes a la creación de la organización
    return await this.organizationRepository.create({
      name,
      baseInterestRate,
      discountRate,
      taxRate,
    });
  }
}
