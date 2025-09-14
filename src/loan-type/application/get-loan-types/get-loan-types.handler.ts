import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoanTypesQuery } from './get-loan-types.query';
import { LoanTypeRepository } from '../../infrastructure/repositories/loan-type.repository';

@QueryHandler(GetLoanTypesQuery)
export class GetLoanTypesHandler implements IQueryHandler<GetLoanTypesQuery> {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(query: GetLoanTypesQuery) {
    return this.loanTypeRepository.searchLoanTypesWithPagination(query);
  }
}



