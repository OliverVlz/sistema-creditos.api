import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';

import { ClientRouteBuilder } from 'src/shared/utils/client-route-builder';
import { MailService } from 'src/shared/mail/mail.service';
import { concatStrings } from 'src/shared/utils';

import { UserRepository } from '../../infrastructure/repositories/user.repository';

import { RecoverPasswordCommand } from './recover-password.command';
import { RecoverPasswordEmail } from './recover-password.email';

@CommandHandler(RecoverPasswordCommand)
export class RecoverPasswordHandler
  implements ICommandHandler<RecoverPasswordCommand>
{
  constructor(
    private readonly clientRoute: ClientRouteBuilder,
    private readonly mailService: MailService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: RecoverPasswordCommand) {
    /* This is not a final implementation, only an example use case for sending an email */
    const user = await this.userRepository.findByEmail(command.email);

    if (!user) {
      return;
    }

    const content = new RecoverPasswordEmail({
      email: user.email,
      data: {
        talentName: concatStrings(
          user.profile.firstName,
          user.profile.lastName,
        ),
        link: this.clientRoute.build('/reset-password'),
        headerUrl: this.clientRoute.build(
          '/email/header-register-invitation.jpg',
        ),
        footerUrl: this.clientRoute.build(
          '/email/footer-register-invitation.jpg',
        ),
      },
    });

    await this.mailService.sendMail(content);
  }
}
