import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanCommand } from './update-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Loan, LoanStatus } from '../../infrastructure/entity/loan.entity';
import { LoanTypeRepository } from 'src/loan-type/infrastructure/repositories/loan-type.repository';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { OrganizationRepository } from 'src/organization/infrastructure/repositories/organization.repository';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { DeepPartial } from 'src/shared/types/utility.types'; // Importar DeepPartial

@CommandHandler(UpdateLoanCommand)
export class UpdateLoanHandler implements ICommandHandler<UpdateLoanCommand> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanTypeRepository: LoanTypeRepository,
    private readonly clientRepository: ClientRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: UpdateLoanCommand): Promise<any> {
    const { id, loanTypeId, clientId, organizationId, amountRequested, interestRate, termMonths, monthlyPayment, status, rejectionReason, approvedBy, approvedAt, signedAt, disbursedAt, updatedBy } = command;

    const existingLoan = await this.loanRepository.findOne(id);
    if (!existingLoan) {
      throw new NotFoundException(`Loan with ID ${id} not found`);
    }

    if (clientId) {
      const client = await this.clientRepository.findOne(clientId);
      if (!client) {
        throw new NotFoundException(`Client with ID ${clientId} not found`);
      }
    }

    if (organizationId) {
      const organization = await this.organizationRepository.findOne(organizationId);
      if (!organization) {
        throw new NotFoundException(`Organization with ID ${organizationId} not found`);
      }
    }

    if (loanTypeId) {
      const loanType = await this.loanTypeRepository.findOne(loanTypeId);
      if (!loanType) {
        throw new NotFoundException(`LoanType with ID ${loanTypeId} not found`);
      }
      // Opcional: Validar que los nuevos monto y plazo estén dentro de los límites del tipo de préstamo
      if (amountRequested && (amountRequested < loanType.minAmount || amountRequested > loanType.maxAmount)) {
        throw new BadRequestException(`Amount requested is outside the limits for this loan type (${loanType.minAmount}-${loanType.maxAmount})`);
      }
      if (termMonths && termMonths > loanType.maxTermMonths) {
        throw new BadRequestException(`Term months exceed the maximum for this loan type (${loanType.maxTermMonths} months)`);
      }
    }

    if (approvedBy) {
      const approver = await this.userRepository.findById(approvedBy);
      if (!approver) {
        throw new NotFoundException(`Approver user with ID ${approvedBy} not found`);
      }
    }

    // Preparar datos para actualización
    const updateData: DeepPartial<Loan> = { // Cambiado a DeepPartial<Loan>
      ...(clientId && { client: { id: clientId } }), // Usar relación
      ...(loanTypeId && { loanType: { id: loanTypeId } }), // Usar relación
      ...(organizationId && { organization: { id: organizationId } }), // Usar relación
      amountRequested,
      interestRate,
      termMonths,
      monthlyPayment,
      status,
      rejectionReason,
      ...(approvedBy && { approver: { id: approvedBy } }), // Usar relación para approver
      approvedAt,
      signedAt,
      disbursedAt,
      ...(updatedBy && { updater: { id: updatedBy } }), // Usar relación para updater
      updatedAt: new Date(),
    };

    // Calcular totalAmount y processingFee si es necesario (basado en loanType)
    // Por simplicidad, se podría hacer una lógica de negocio aquí o en un servicio dedicado.
    // Aquí un ejemplo básico si amountRequested cambia y se necesita recalcular el total
    if (amountRequested && loanTypeId) {
        const loanType = await this.loanTypeRepository.findOne(loanTypeId || existingLoan.loanType?.id); // Corregido
        if (loanType) {
            updateData.processingFee = amountRequested * loanType.baseProcessingFee; // Ejemplo simple
            updateData.totalAmount = amountRequested + updateData.processingFee; // Ejemplo simple
        }
    }

    const updatedLoan = await this.loanRepository.updateLoan(id, updateData);
    return { loanId: updatedLoan.id };
  }
}
