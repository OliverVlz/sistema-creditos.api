import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanCommand } from './create-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { OrganizationRepository } from 'src/organization/infrastructure/repositories/organization.repository';
import { LoanTypeRepository } from 'src/loan/infrastructure/repositories/loan-type.repository'; // Nueva importación
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';

@CommandHandler(CreateLoanCommand)
export class CreateLoanHandler implements ICommandHandler<CreateLoanCommand> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly clientRepository: ClientRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly loanTypeRepository: LoanTypeRepository,
  ) {}

  async execute(command: CreateLoanCommand): Promise<any> {
    const { clientId, loanTypeId, organizationId, amountRequested, interestRate, termMonths, monthlyPayment, createdBy, notes } = command;

    // 1. Verificar existencia del cliente
    const client = await this.clientRepository.findOne(clientId);
    if (!client) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }
    
    // 2. Verificar existencia de la organización
    const organization = await this.organizationRepository.findOne(organizationId);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    // 3. Verificar existencia del tipo de préstamo
    const loanType = await this.loanTypeRepository.findOne(loanTypeId);
    if (!loanType) {
      throw new NotFoundException(`LoanType with ID ${loanTypeId} not found`);
    }

    // Opcional: Validar que el monto y plazo estén dentro de los límites del tipo de préstamo
    if (amountRequested < loanType.minAmount || amountRequested > loanType.maxAmount) {
        throw new BadRequestException(`Amount requested is outside the limits for this loan type (${loanType.minAmount}-${loanType.maxAmount})`);
    }
    if (termMonths > loanType.maxTermMonths) {
        throw new BadRequestException(`Term months exceed the maximum for this loan type (${loanType.maxTermMonths} months)`);
    }

    // 4. Generar número de préstamo único
    const loanNumber = await this.loanRepository.generateLoanNumber();

    // 5. Crear el préstamo
    const newLoan = await this.loanRepository.createLoan({
      loanNumber,
      clientId,
      loanTypeId,
      organizationId,
      amountRequested,
      interestRate,
      termMonths,
      monthlyPayment,
      createdBy,
      notes,
      status: LoanStatus.PENDING, // Estado inicial
      // Otros campos de fecha se establecerán al aprobar/firmar/desembolsar
    });

    return { loanId: newLoan.id };
  }
}
