import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { GetLoanByIdQuery } from './get-loan-by-id.query';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'src/shared/enums';
import { LoanCalculatorService } from '../../domain/loan-calculator.service';
import { StorageService } from 'src/storage/infrastructure/storage.service';

@QueryHandler(GetLoanByIdQuery)
export class GetLoanByIdHandler implements IQueryHandler<GetLoanByIdQuery> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanCalculatorService: LoanCalculatorService,
    private readonly storageService: StorageService,
  ) {}

  async execute(query: GetLoanByIdQuery) {
    const loan = await this.loanRepository.findOne(query.id);

    // Validar acceso: Cliente solo puede ver sus propios préstamos
    if (query.requestingUserRole === UserRole.CLIENTE) {
      // El cliente se identifica por su userId que está en client.user.id
      if (loan.client?.user?.id !== query.requestingUserId) {
        throw new ForbiddenException(
          'No tienes permiso para ver este préstamo',
        );
      }
    }

    // Calcular tasa efectiva mensual usando servicio centralizado
    const annualRate = Number(loan.appliedInterestRate);
    const monthlyRate =
      this.loanCalculatorService.getEffectiveMonthlyRate(annualRate);

    const documents = await Promise.all(
      (loan.documents || []).map(async doc => {
        const key = this.storageService.extractObjectKeyFromUrl(doc.url);
        const signedUrl = key
          ? await this.storageService.getPresignedUrl(key)
          : doc.url;

        return {
          id: doc.id,
          url: signedUrl,
          uploadedAt: doc.uploadedAt,
          documentType: doc.documentType
            ? {
                id: doc.documentType.id,
                code: doc.documentType.code,
                name: doc.documentType.name,
              }
            : null,
        };
      }),
    );

    return {
      id: loan.id,
      loanNumber: loan.loanNumber,
      status: loan.status,
      rejectionReason: loan.rejectionReason || null,
      amountRequested: loan.amountRequested,
      monthlyRate,
      annualRate,
      monthlyPayment: loan.monthlyPayment,
      totalInterest: loan.totalInterest,
      totalPayable: loan.totalPayable,
      termMonths: loan.termMonths,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
      client: loan.client
        ? {
            id: loan.client.id,
            employmentStatus: loan.client.employmentStatus,
            address: loan.client.address,
            birthDate: loan.client.birthDate,
            user: loan.client.user
              ? {
                  id: loan.client.user.id,
                  firstName: loan.client.user.firstName,
                  lastName: loan.client.user.lastName,
                  email: loan.client.user.email,
                  phoneNumber: loan.client.user.phoneNumber,
                  documentNumber: loan.client.user.documentNumber,
                }
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
            interestRate: loan.loanType.interestRate,
            minAmount: loan.loanType.minAmount,
            maxAmount: loan.loanType.maxAmount,
            minTerm: loan.loanType.minTerm,
            maxTerm: loan.loanType.maxTerm,
          }
        : null,
      manager: loan.manager
        ? {
            id: loan.manager.id,
            firstName: loan.manager.firstName,
            lastName: loan.manager.lastName,
            email: loan.manager.email,
          }
        : null,
      documents,
    };
  }
}
