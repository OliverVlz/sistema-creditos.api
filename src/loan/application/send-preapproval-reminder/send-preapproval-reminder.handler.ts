import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';
import { LoanStatusEmailService } from '../shared/loan-status-email.service';
import { SendPreapprovalReminderCommand } from './send-preapproval-reminder.command';

@CommandHandler(SendPreapprovalReminderCommand)
export class SendPreapprovalReminderHandler
  implements ICommandHandler<SendPreapprovalReminderCommand>
{
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanStatusEmailService: LoanStatusEmailService,
  ) {}

  async execute(command: SendPreapprovalReminderCommand) {
    const loan = await this.loanRepository.findOne(command.loanId);

    if (loan.status !== LoanStatus.PREAPROBADO) {
      throw new BadRequestException(
        'Solo se puede enviar recordatorio para solicitudes preaprobadas',
      );
    }

    const clientEmail = loan.client?.user?.email;
    if (!clientEmail) {
      throw new BadRequestException(
        'La solicitud no tiene correo del cliente para enviar recordatorio',
      );
    }

    await this.loanStatusEmailService.sendPreapprovalReminderEmail({
      email: clientEmail,
      firstName: loan.client?.user?.firstName,
      loanNumber: loan.loanNumber,
      details: loan.rejectionReason || undefined,
    });

    return {
      loanId: loan.id,
      remindedBy: command.requestedBy,
      message: 'Recordatorio enviado correctamente',
    };
  }
}
