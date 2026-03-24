import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { HashService } from 'src/shared/hash';

import { AuthService } from '../../infrastructure/auth.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { ResetPasswordCommand } from './reset-password.command';

type ResetPasswordTokenPayload = {
  type: string;
  userId: string;
};

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  constructor(
    private readonly authService: AuthService,
    private readonly userRepository: UserRepository,
    private readonly hashService: HashService,
  ) {}

  async execute(command: ResetPasswordCommand) {
    const payload =
      await this.authService.verifyToken(command.token) as ResetPasswordTokenPayload;

    if (payload.type !== 'password-recovery' || !payload.userId) {
      throw new BadRequestException('Token de recuperación inválido');
    }

    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new BadRequestException('Token de recuperación inválido');
    }

    const hashedPassword = await this.hashService.hash(command.newPassword);
    await this.userRepository.updatePassword(user.id, hashedPassword);

    return {
      message: 'Contraseña restablecida exitosamente',
    };
  }
}
