import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetLoanDocumentByIdQuery } from './get-loan-document-by-id.query';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';

@QueryHandler(GetLoanDocumentByIdQuery)
export class GetLoanDocumentByIdHandler
  implements IQueryHandler<GetLoanDocumentByIdQuery>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
  ) {}

  async execute(query: GetLoanDocumentByIdQuery): Promise<any> {
    return this.loanDocumentRepository.findOne(query.id);
  }
}
