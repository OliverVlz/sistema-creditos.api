import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DeleteUserAdminCommand } from './delete-user-admin.command';
import { User } from '../../infrastructure/entity/user.entity';
import { UserRole } from 'src/shared/enums';

@CommandHandler(DeleteUserAdminCommand)
export class DeleteUserAdminHandler
  implements ICommandHandler<DeleteUserAdminCommand>
{
  constructor(private readonly dataSource: DataSource) {}

  async execute(command: DeleteUserAdminCommand) {
    return this.dataSource.transaction(async manager => {
      const user = await manager.getRepository(User).findOne({
        where: { id: command.userId },
        relations: ['client'],
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (user.role === UserRole.ADMIN || user.role === UserRole.ASESOR) {
        await manager.getRepository(User).update(user.id, { isActive: false });
        return {
          message: 'Usuario desactivado correctamente',
        };
      }

      if (user.client?.id) {
        await manager
          .createQueryBuilder()
          .delete()
          .from('loans')
          .where('client_id = :clientId', { clientId: user.client.id })
          .execute();

        await manager
          .createQueryBuilder()
          .delete()
          .from('clients')
          .where('id = :clientId', { clientId: user.client.id })
          .execute();
      }

      await manager.query(
        'UPDATE loans SET managed_by = NULL, managed_at = NULL WHERE managed_by = $1',
        [command.userId],
      );

      await manager
        .createQueryBuilder()
        .delete()
        .from('users')
        .where('id = :userId', { userId: command.userId })
        .execute();

      return {
        message: 'Usuario eliminado correctamente',
      };
    });
  }
}
