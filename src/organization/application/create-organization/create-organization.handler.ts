import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OrganizationRepository } from '../../infrastructure/repositories/organization.repository';
import { CreateOrganizationCommand } from './create-organization.command';

@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationHandler
  implements ICommandHandler<CreateOrganizationCommand>
{
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(command: CreateOrganizationCommand) {
    const { name, description } = command;

    return await this.organizationRepository.create({
      name,
      description,
    });
  }
}
