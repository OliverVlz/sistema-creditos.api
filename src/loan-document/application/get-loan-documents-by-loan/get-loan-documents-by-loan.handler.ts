import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetLoanDocumentsByLoanQuery } from './get-loan-documents-by-loan.query';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';
import { StorageService } from 'src/storage/infrastructure/storage.service';

@QueryHandler(GetLoanDocumentsByLoanQuery)
export class GetLoanDocumentsByLoanHandler
  implements IQueryHandler<GetLoanDocumentsByLoanQuery>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(query: GetLoanDocumentsByLoanQuery): Promise<any> {
    const documents = await this.loanDocumentRepository.findByLoan(
      query.loanId,
    );

    return Promise.all(
      documents.map(async document => {
        const key = this.storageService.extractObjectKeyFromUrl(document.url);
        const signedUrl = key
          ? await this.storageService.getPresignedUrl(key)
          : document.url;

        return {
          ...document,
          url: signedUrl,
        };
      }),
    );
  }
}
