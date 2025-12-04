import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { GetLoansQuery } from './get-loans.query';
import { LoanCalculatorService } from '../../domain/loan-calculator.service';

@QueryHandler(GetLoansQuery)
export class GetLoansHandler implements IQueryHandler<GetLoansQuery> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanCalculatorService: LoanCalculatorService,
  ) {}

  async execute(query: GetLoansQuery) {
    const result = await this.loanRepository.searchLoansWithPagination(query);

    const transformedData = result.data.map(loan => {
      // Calcular tasa efectiva mensual usando servicio centralizado
      const annualRate = Number(loan.appliedInterestRate);
      const monthlyRate =
        this.loanCalculatorService.getEffectiveMonthlyRate(annualRate);

      return {
        id: loan.id,
        loanNumber: loan.loanNumber,
        status: loan.status,
        amountRequested: loan.amountRequested,
        termMonths: loan.termMonths,
        monthlyRate,
        annualRate,
        createdAt: loan.createdAt,
        updatedAt: loan.updatedAt,
        client: loan.client
          ? {
              id: loan.client.id,
              name: loan.client.user
                ? `${loan.client.user.firstName} ${loan.client.user.lastName}`
                : null,
            }
          : null,
        organization: loan.organization
          ? {
              id: loan.organization.id,
              name: loan.organization.name,
            }
          : null,
        loanType: loan.loanType
          ? {
              id: loan.loanType.id,
              name: loan.loanType.name,
            }
          : null,
      };
    });

    return { ...result, data: transformedData };
  }
}
