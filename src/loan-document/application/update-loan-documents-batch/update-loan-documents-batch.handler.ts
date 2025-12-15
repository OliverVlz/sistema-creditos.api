import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanDocumentsBatchCommand } from './update-loan-documents-batch.command';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';

@CommandHandler(UpdateLoanDocumentsBatchCommand)
export class UpdateLoanDocumentsBatchHandler
  implements ICommandHandler<UpdateLoanDocumentsBatchCommand>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
  ) {}

  async execute(command: UpdateLoanDocumentsBatchCommand): Promise<any> {
    const { documents } = command;

    const updatedIds: string[] = [];

    for (const doc of documents) {
      await this.loanDocumentRepository.update(doc.id, doc.url);
      updatedIds.push(doc.id);
    }

    return {
      documentsUpdated: updatedIds.length,
      documentIds: updatedIds,
    };
  }
}




