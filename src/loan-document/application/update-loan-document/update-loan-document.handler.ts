import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanDocumentCommand } from './update-loan-document.command';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';

@CommandHandler(UpdateLoanDocumentCommand)
export class UpdateLoanDocumentHandler
  implements ICommandHandler<UpdateLoanDocumentCommand>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
  ) {}

  async execute(command: UpdateLoanDocumentCommand): Promise<any> {
    const { id, url, status, rejectionNote } = command;

    await this.loanDocumentRepository.findOne(id);

    const updated = await this.loanDocumentRepository.update(id, {
      url,
      status,
      rejectionNote,
    });

    return { documentId: updated.id };
  }
}

