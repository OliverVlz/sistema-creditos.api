import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanTypeCommand } from './create-loan-type.command';
import { LoanTypeRepository } from '../../infrastructure/repositories/loan-type.repository';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateLoanTypeCommand)
export class CreateLoanTypeHandler implements ICommandHandler<CreateLoanTypeCommand> {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(command: CreateLoanTypeCommand): Promise<any> {
    const { name, description, baseProcessingFee, maxAmount, minAmount, maxTermMonths, isActive, requiredDocumentTypes } = command;

    // Opcional: Validar que no exista un LoanType con el mismo nombre
    const existingLoanType = await this.loanTypeRepository.findByName(name);
    if (existingLoanType) {
      throw new BadRequestException(`LoanType with name "${name}" already exists`);
    }

    const newLoanType = await this.loanTypeRepository.createLoanType({
      name,
      description,
      baseProcessingFee,
      maxAmount,
      minAmount,
      maxTermMonths,
      isActive,
      requiredDocumentTypes,
    });

    return { loanTypeId: newLoanType.id };
  }
}



