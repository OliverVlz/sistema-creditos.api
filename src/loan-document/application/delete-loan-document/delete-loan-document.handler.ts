import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanDocumentCommand } from './delete-loan-document.command';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';

@CommandHandler(DeleteLoanDocumentCommand)
export class DeleteLoanDocumentHandler
  implements ICommandHandler<DeleteLoanDocumentCommand>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
  ) {}

  async execute(command: DeleteLoanDocumentCommand): Promise<void> {
    const { id } = command;

    await this.loanDocumentRepository.findOne(id);
    await this.loanDocumentRepository.delete(id);
  }
}

