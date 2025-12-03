import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanCommand } from './create-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { OrganizationRepository } from 'src/organization/infrastructure/repositories/organization.repository';
import { LoanTypeRepository } from 'src/loan-type/infrastructure/repositories/loan-type.repository';
import { LoanCalculatorService } from '../../domain/loan-calculator.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';

@CommandHandler(CreateLoanCommand)
export class CreateLoanHandler implements ICommandHandler<CreateLoanCommand> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly clientRepository: ClientRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly loanTypeRepository: LoanTypeRepository,
    private readonly loanCalculatorService: LoanCalculatorService,
  ) {}

  async execute(command: CreateLoanCommand): Promise<any> {
    const {
      clientId,
      loanTypeId,
      organizationId,
      amountRequested,
      termMonths,
      monthlyPayment: frontendMonthlyPayment,
      totalInterest: frontendTotalInterest,
      totalPayable: frontendTotalPayable,
    } = command;

    const client = await this.clientRepository.findOne(clientId);
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }

    const organization =
      await this.organizationRepository.findOne(organizationId);
    if (!organization) {
      throw new NotFoundException(
        `Organización con ID ${organizationId} no encontrada`,
      );
    }

    const loanType = await this.loanTypeRepository.findOne(loanTypeId);
    if (!loanType) {
      throw new NotFoundException(
        `Tipo de préstamo con ID ${loanTypeId} no encontrado`,
      );
    }

    if (
      amountRequested < loanType.minAmount ||
      amountRequested > loanType.maxAmount
    ) {
      throw new BadRequestException(
        `Monto solicitado fuera de los límites para este tipo de préstamo (${loanType.minAmount}-${loanType.maxAmount})`,
      );
    }

    if (termMonths < loanType.minTerm || termMonths > loanType.maxTerm) {
      throw new BadRequestException(
        `Plazo fuera de los límites para este tipo de préstamo (${loanType.minTerm}-${loanType.maxTerm} meses)`,
      );
    }

    const appliedInterestRate = Number(loanType.interestRate);

    const validatedCalculation =
      this.loanCalculatorService.validateAndCalculate({
        amountRequested,
        termMonths,
        annualInterestRate: appliedInterestRate,
        frontendMonthlyPayment,
        frontendTotalInterest,
        frontendTotalPayable,
      });

    const loanNumber = await this.loanRepository.generateLoanNumber();

    const newLoan = await this.loanRepository.createLoan({
      loanNumber,
      client: { id: clientId },
      loanType: { id: loanTypeId },
      organization: { id: organizationId },
      amountRequested,
      termMonths,
      appliedInterestRate,
      monthlyPayment: validatedCalculation.monthlyPayment,
      totalInterest: validatedCalculation.totalInterest,
      totalPayable: validatedCalculation.totalPayable,
      status: LoanStatus.PENDIENTE,
    });

    return { loanId: newLoan.id };
  }
}
