import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetClientByIdQuery } from './get-client-by-id.query';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { User } from 'src/identity/domain/user.model';

@QueryHandler(GetClientByIdQuery)
export class GetClientByIdHandler implements IQueryHandler<GetClientByIdQuery> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: GetClientByIdQuery) {
    const client = await this.clientRepository.findOneByUserIdWithLoans(
      query.userId,
    );

    if (!client) return null;

    return {
      ...User.fromModel(client.user).getUserInfo(),
      clientInfo: {
        id: client.id,
        employmentStatus: client.employmentStatus,
        address: client.address,
        birthDate: client.birthDate,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        user: client.user ? User.fromModel(client.user).getUserInfo() : null,
        organization: client.organization
          ? {
              id: client.organization.id,
              name: client.organization.name,
              baseInterestRate: client.organization.baseInterestRate,
              discountRate: client.organization.discountRate,
              taxRate: client.organization.taxRate,
              isActive: client.organization.isActive,
              createdAt: client.organization.createdAt,
              updatedAt: client.organization.updatedAt,
            }
          : null,
        updater: client.updater
          ? User.fromModel(client.updater).getUserInfo()
          : null,
        loans: client.loans?.map(loan => ({
          id: loan.id,
          loanNumber: loan.loanNumber,
          amountRequested: loan.amountRequested,
          termMonths: loan.termMonths,
          monthlyPayment: loan.monthlyPayment,
          totalAmount: loan.totalAmount,
          interestRate: loan.interestRate,
          processingFee: loan.processingFee,
          status: loan.status,
          rejectionReason: loan.rejectionReason,
          approvedAt: loan.approvedAt,
          signedAt: loan.signedAt,
          disbursedAt: loan.disbursedAt,
          createdAt: loan.createdAt,
          updatedAt: loan.updatedAt,
          loanType: loan.loanType
            ? {
                id: loan.loanType.id,
                name: loan.loanType.name,
              }
            : undefined,
          organization: loan.organization
            ? {
                id: loan.organization.id,
                name: loan.organization.name,
              }
            : undefined,
        })),
      },
    };
  }
}
