import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanTypeCommand } from './update-loan-type.command';
import { LoanTypeRepository } from '../../infrastructure/repositories/loan-type.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateLoanTypeCommand)
export class UpdateLoanTypeHandler
  implements ICommandHandler<UpdateLoanTypeCommand>
{
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(command: UpdateLoanTypeCommand): Promise<any> {
    const {
      id,
      name,
      description,
      interestRate,
      minAmount,
      maxAmount,
      minTerm,
      maxTerm,
      isActive,
      requiredDocumentTypeIds,
    } = command;

    const existingLoanType = await this.loanTypeRepository.findOne(id);
    if (!existingLoanType) {
      throw new NotFoundException(`Tipo de préstamo con ID ${id} no encontrado`);
    }

    if (name && name !== existingLoanType.name) {
      const loanTypeWithName = await this.loanTypeRepository.findByName(name);
      if (loanTypeWithName) {
        throw new BadRequestException(
          `Ya existe un tipo de préstamo con el nombre "${name}"`,
        );
      }
    }

    const updatedLoanType = await this.loanTypeRepository.updateLoanType(id, {
      name,
      description,
      interestRate,
      minAmount,
      maxAmount,
      minTerm,
      maxTerm,
      isActive,
      requiredDocumentTypeIds,
    });

    return { loanTypeId: updatedLoanType.id };
  }
}
