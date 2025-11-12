import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePasswordCommand } from './update-password.command';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordHandler
  implements ICommandHandler<UpdatePasswordCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdatePasswordCommand) {
    // Buscar usuario con password
    const user = await this.userRepository.findByIdWithPassword(
      command.userId,
      true,
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      command.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(command.newPassword, 10);

    // Actualizar contraseña
    await this.userRepository.updatePassword(command.userId, hashedPassword);

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }
}
