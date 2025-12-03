import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetLoanDocumentsByLoanQuery } from './get-loan-documents-by-loan.query';
import { LoanDocumentRepository } from '../../infrastructure/repositories/loan-document.repository';

@QueryHandler(GetLoanDocumentsByLoanQuery)
export class GetLoanDocumentsByLoanHandler
  implements IQueryHandler<GetLoanDocumentsByLoanQuery>
{
  constructor(
    private readonly loanDocumentRepository: LoanDocumentRepository,
  ) {}

  async execute(query: GetLoanDocumentsByLoanQuery): Promise<any> {
    return this.loanDocumentRepository.findByLoan(query.loanId);
  }
}
