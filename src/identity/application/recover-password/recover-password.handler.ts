import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

import { ClientRouteBuilder } from 'src/shared/utils/client-route-builder';
import { MailService } from 'src/shared/mail/mail.service';

import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { AuthService } from '../../infrastructure/auth.service';
import { ApiConfig } from 'src/config/api.config';

import { RecoverPasswordCommand } from './recover-password.command';
import { RecoverPasswordEmail } from './recover-password.email';

@CommandHandler(RecoverPasswordCommand)
export class RecoverPasswordHandler
  implements ICommandHandler<RecoverPasswordCommand> {
  private readonly apiConfig: ApiConfig;

  constructor(
    private readonly clientRoute: ClientRouteBuilder,
    private readonly mailService: MailService,
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.apiConfig = this.configService.get('api');
  }

  async execute(command: RecoverPasswordCommand) {
    const user = await this.userRepository.findByEmail(command.email.toLowerCase().trim());

    if (!user) {
      return;
    }

    const token = await this.authService.generateToken(
      {
        type: 'password-recovery',
        userId: user.id,
      },
      { expiresIn: this.apiConfig.passwordRecoveryTime },
    );

    const recoveryLink = this.clientRoute.build(
      `/restablecer-contrasena?token=${encodeURIComponent(token)}`,
    );

    const content = new RecoverPasswordEmail({
      email: user.email,
      data: {
        firstName: user.firstName,
        recoveryLink,
        logoUrl: this.apiConfig.mailLogoUrl,
      },
    });

    await this.mailService.sendMail(content);
  }
}
