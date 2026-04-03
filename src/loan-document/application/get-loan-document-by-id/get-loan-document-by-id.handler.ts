import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetLoanDocumentByIdQuery } from './get-loan-document-by-id.query';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';
import { StorageService } from 'src/storage/infrastructure/storage.service';

@QueryHandler(GetLoanDocumentByIdQuery)
export class GetLoanDocumentByIdHandler
  implements IQueryHandler<GetLoanDocumentByIdQuery>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(query: GetLoanDocumentByIdQuery): Promise<any> {
    const document = await this.loanDocumentRepository.findOne(query.id);
    const key = this.storageService.extractObjectKeyFromUrl(document.url);
    const signedUrl = key
      ? await this.storageService.getPresignedUrl(key)
      : document.url;

    return {
      ...document,
      url: signedUrl,
    };
  }
}
