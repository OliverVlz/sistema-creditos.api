import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetLoanTypeByIdQuery } from './get-loan-type-by-id.query';
import { LoanTypeRepository } from '../../infrastructure/repositories/loan-type.repository';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetLoanTypeByIdQuery)
export class GetLoanTypeByIdHandler implements IQueryHandler<GetLoanTypeByIdQuery> {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(query: GetLoanTypeByIdQuery): Promise<any> {
    const loanType = await this.loanTypeRepository.findOne(query.id);
    if (!loanType) {
      throw new NotFoundException(`LoanType with ID ${query.id} not found`);
    }
    return loanType;
  }
}



