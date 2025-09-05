import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { GetLoansQuery } from './get-loans.query';

@QueryHandler(GetLoansQuery)
export class GetLoansHandler implements IQueryHandler<GetLoansQuery> {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(query: GetLoansQuery) {
    return this.loanRepository.searchLoansWithPagination(query);
  }
}
