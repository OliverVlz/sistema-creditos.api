import {
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { UpdateClientProfileCommand } from './update-client-profile.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { Client } from '../../infrastructure/entity/client.entity';
import { GetClientByIdQuery } from '../get-client-by-id/get-client-by-id.query';
import { extractYmdFromDto } from 'src/shared/utils/date-only';

@CommandHandler(UpdateClientProfileCommand)
export class UpdateClientProfileHandler
  implements ICommandHandler<UpdateClientProfileCommand>
{
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly dataSource: DataSource,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: UpdateClientProfileCommand) {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const clientRepo = manager.getRepository(Client);
      const userRepo = manager.getRepository(User);
      const orgRepo = manager.getRepository(Organization);

      const client = await this.clientRepository.findOneByUserId(
        command.userId,
      );

      if (!client) {
        throw new NotFoundException('Cliente no encontrado');
      }

      if (command.organizationId) {
        const orgExists = await orgRepo.exists({
          where: { id: command.organizationId },
        });
        if (!orgExists) {
          throw new BadRequestException('Organización no encontrada');
        }
      }

      const clientUpdateData: Record<string, unknown> = {};
      if (command.address !== undefined)
        clientUpdateData.address = command.address;
      if (command.employmentStatus !== undefined)
        clientUpdateData.employmentStatus = command.employmentStatus;
      if (command.organizationId !== undefined)
        clientUpdateData.organizationId = command.organizationId;

      if (command.birthDate !== undefined) {
        const ymd = extractYmdFromDto(command.birthDate);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
          throw new BadRequestException('birthDate inválida');
        }
        await this.clientRepository.updateBirthDateById(client.id, ymd, manager);
      }

      if (Object.keys(clientUpdateData).length > 0) {
        await clientRepo.update(client.id, clientUpdateData);
      }

      const userUpdateData: Record<string, unknown> = {};
      if (command.phoneNumber !== undefined)
        userUpdateData.phoneNumber = command.phoneNumber;
      if (command.firstName !== undefined)
        userUpdateData.firstName = command.firstName;
      if (command.lastName !== undefined)
        userUpdateData.lastName = command.lastName;

      userUpdateData.updater = client.user;

      if (Object.keys(userUpdateData).length > 0) {
        await userRepo.save({ ...client.user, ...userUpdateData });
      }
    });

    return this.queryBus.execute(new GetClientByIdQuery(command.userId));
  }
}
