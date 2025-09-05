import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteOrganizationCommand } from './delete-organization.command';
import { OrganizationRepository } from '../../infrastructure/repositories/organization.repository';

@CommandHandler(DeleteOrganizationCommand)
export class DeleteOrganizationHandler implements ICommandHandler<DeleteOrganizationCommand> {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(command: DeleteOrganizationCommand): Promise<void> {
    return this.organizationRepository.remove(command.id);
  }
}
