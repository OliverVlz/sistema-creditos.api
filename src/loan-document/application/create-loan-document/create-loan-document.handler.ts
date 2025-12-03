import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanDocumentCommand } from './create-loan-document.command';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';

@CommandHandler(CreateLoanDocumentCommand)
export class CreateLoanDocumentHandler
  implements ICommandHandler<CreateLoanDocumentCommand>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
  ) {}

  async execute(command: CreateLoanDocumentCommand): Promise<any> {
    const { loanId, documentTypeId, url } = command;

    const newDocument = await this.loanDocumentRepository.create({
      loanId,
      documentTypeId,
      url,
    });

    return { documentId: newDocument.id };
  }
}

