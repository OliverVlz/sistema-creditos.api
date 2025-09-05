import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateOrganizationCommand } from './update-organization.command';
import { OrganizationRepository } from '../../infrastructure/repositories/organization.repository';
import { NotFoundException } from '@nestjs/common';
import { Organization } from '../../infrastructure/entity/organization.entity';

@CommandHandler(UpdateOrganizationCommand)
export class UpdateOrganizationHandler implements ICommandHandler<UpdateOrganizationCommand> {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async execute(command: UpdateOrganizationCommand): Promise<Organization> {
    const existingOrganization = await this.organizationRepository.findOne(command.id);
    if (!existingOrganization) {
      throw new NotFoundException('Organización no encontrada');
    }

    const { id, ...updateData } = command;

    return this.organizationRepository.update(id, updateData);
  }
}
