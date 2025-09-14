import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanTypeCommand } from './update-loan-type.command';
import { LoanTypeRepository } from '../../infrastructure/repositories/loan-type.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateLoanTypeCommand)
export class UpdateLoanTypeHandler implements ICommandHandler<UpdateLoanTypeCommand> {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(command: UpdateLoanTypeCommand): Promise<any> {
    const { id, name, description, baseProcessingFee, maxAmount, minAmount, maxTermMonths, isActive, requiredDocumentTypes, updatedBy } = command;

    const existingLoanType = await this.loanTypeRepository.findOne(id);
    if (!existingLoanType) {
      throw new NotFoundException(`LoanType with ID ${id} not found`);
    }

    // Opcional: Validar que el nuevo nombre no exista para otro LoanType
    if (name && name !== existingLoanType.name) {
      const loanTypeWithName = await this.loanTypeRepository.findByName(name);
      if (loanTypeWithName) {
        throw new BadRequestException(`LoanType with name "${name}" already exists`);
      }
    }

    const updatedLoanType = await this.loanTypeRepository.updateLoanType(id, {
      name,
      description,
      baseProcessingFee,
      maxAmount,
      minAmount,
      maxTermMonths,
      isActive,
      requiredDocumentTypes,
      updatedBy,
    });

    return { loanTypeId: updatedLoanType.id };
  }
}



