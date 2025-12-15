import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanDocumentsBatchCommand } from './create-loan-documents-batch.command';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';

@CommandHandler(CreateLoanDocumentsBatchCommand)
export class CreateLoanDocumentsBatchHandler
  implements ICommandHandler<CreateLoanDocumentsBatchCommand>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
  ) {}

  async execute(command: CreateLoanDocumentsBatchCommand): Promise<any> {
    const { loanId, documents } = command;

    const createdDocuments = await this.loanDocumentRepository.createBatch(
      loanId,
      documents,
    );

    return {
      loanId,
      documentsCreated: createdDocuments.length,
      documentIds: createdDocuments.map(doc => doc.id),
    };
  }
}



