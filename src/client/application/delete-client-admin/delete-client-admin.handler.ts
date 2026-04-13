import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DeleteClientAdminCommand } from './delete-client-admin.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';

@CommandHandler(DeleteClientAdminCommand)
export class DeleteClientAdminHandler
  implements ICommandHandler<DeleteClientAdminCommand>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: DeleteClientAdminCommand) {
    return this.dataSource.transaction(async manager => {
      const client = await this.clientRepository.findOneByUserId(
        command.userId,
        manager,
      );

      if (!client) {
        throw new NotFoundException('Cliente no encontrado');
      }

      await manager
        .createQueryBuilder()
        .delete()
        .from('loans')
        .where('client_id = :clientId', { clientId: client.id })
        .execute();

      await manager
        .createQueryBuilder()
        .delete()
        .from('clients')
        .where('id = :clientId', { clientId: client.id })
        .execute();

      await manager
        .createQueryBuilder()
        .delete()
        .from('users')
        .where('id = :userId', { userId: command.userId })
        .execute();

      return {
        message: 'Cliente y solicitudes eliminados correctamente',
      };
    });
  }
}
