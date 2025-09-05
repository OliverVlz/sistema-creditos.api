import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { GetLoanByIdQuery } from './get-loan-by-id.query';

@QueryHandler(GetLoanByIdQuery)
export class GetLoanByIdHandler implements IQueryHandler<GetLoanByIdQuery> {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(query: GetLoanByIdQuery) {
    return this.loanRepository.findOne(query.id);
  }
}
