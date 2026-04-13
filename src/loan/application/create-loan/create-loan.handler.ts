import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanCommand } from './create-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { OrganizationRepository } from 'src/organization/infrastructure/repositories/organization.repository';
import { LoanTypeRepository } from 'src/loan-type/infrastructure/repositories/loan-type.repository';
import { LoanDocumentRepository } from 'src/loan-document/infrastructure/repositories/loan-document.repository';
import { DocumentTypeRepository } from 'src/document-type/infrastructure/repositories/document-type.repository';
import { LoanCalculatorService } from '../../domain/loan-calculator.service';
import { NotificationsService } from 'src/notifications/infrastructure/notifications.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';

@CommandHandler(CreateLoanCommand)
export class CreateLoanHandler implements ICommandHandler<CreateLoanCommand> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly clientRepository: ClientRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly loanTypeRepository: LoanTypeRepository,
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly documentTypeRepository: DocumentTypeRepository,
    private readonly loanCalculatorService: LoanCalculatorService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async execute(command: CreateLoanCommand): Promise<any> {
    const {
      clientId,
      loanTypeName,
      organizationName,
      amountRequested,
      termMonths,
      monthlyPayment: frontendMonthlyPayment,
      totalInterest: frontendTotalInterest,
      totalPayable: frontendTotalPayable,
      documents,
    } = command;

    // Validar cliente por ID (viene del token)
    const client = await this.clientRepository.findOne(clientId);
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }

    // Buscar organización por nombre
    const organization =
      await this.organizationRepository.findByName(organizationName);
    if (!organization) {
      throw new NotFoundException(
        `Organización "${organizationName}" no encontrada`,
      );
    }

    // Buscar tipo de préstamo por nombre
    const loanType = await this.loanTypeRepository.findByName(loanTypeName);
    if (!loanType) {
      throw new NotFoundException(
        `Tipo de préstamo "${loanTypeName}" no encontrado`,
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

    const newLoan = await this.loanRepository.createLoanWithAutoNumber({
      client: { id: client.id },
      loanType: { id: loanType.id },
      organization: { id: organization.id },
      amountRequested,
      termMonths,
      appliedInterestRate,
      monthlyPayment: validatedCalculation.monthlyPayment,
      totalInterest: validatedCalculation.totalInterest,
      totalPayable: validatedCalculation.totalPayable,
      status: LoanStatus.PENDIENTE,
    });

    if (documents && documents.length > 0) {
      const codes = documents.map(d => d.documentTypeCode);
      const documentTypes =
        await this.documentTypeRepository.findByCodes(codes);

      const codeToIdMap = new Map(documentTypes.map(dt => [dt.code, dt.id]));

      const documentsWithIds = documents.map(doc => {
        const documentTypeId = codeToIdMap.get(doc.documentTypeCode);
        if (!documentTypeId) {
          throw new BadRequestException(
            `Tipo de documento con código "${doc.documentTypeCode}" no encontrado`,
          );
        }
        return { documentTypeId, url: doc.url };
      });

      await this.loanDocumentRepository.createBatch(
        newLoan.id,
        documentsWithIds,
      );
    }

    // Send notification to admins/advisors
    this.notificationsService.notifyLoanCreated({
      loanId: newLoan.id,
      loanNumber: newLoan.loanNumber,
      clientId: client.user?.id || '',
      clientName: client.user
        ? `${client.user.firstName} ${client.user.lastName}`
        : 'Cliente',
      status: newLoan.status,
      amountRequested: newLoan.amountRequested,
      timestamp: new Date(),
    });

    return { loanId: newLoan.id };
  }
}
