import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePasswordAdminCommand } from './update-password-admin.command';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@CommandHandler(UpdatePasswordAdminCommand)
export class UpdatePasswordAdminHandler
  implements ICommandHandler<UpdatePasswordAdminCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdatePasswordAdminCommand) {
    // Buscar usuario
    const user = await this.userRepository.findById(command.userId, true);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(command.newPassword, 10);

    // Actualizar contraseña
    await this.userRepository.updatePassword(command.userId, hashedPassword);

    return {
      message: 'Contraseña actualizada exitosamente',
      userId: user.id,
    };
  }
}
