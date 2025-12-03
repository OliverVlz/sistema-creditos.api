import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanTypeCommand } from './create-loan-type.command';
import { LoanTypeRepository } from '../../infrastructure/repositories/loan-type.repository';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateLoanTypeCommand)
export class CreateLoanTypeHandler
  implements ICommandHandler<CreateLoanTypeCommand>
{
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(command: CreateLoanTypeCommand): Promise<any> {
    const {
      name,
      description,
      interestRate,
      minAmount,
      maxAmount,
      minTerm,
      maxTerm,
      isActive = true,
      requiredDocumentTypeIds,
    } = command;

    const existingLoanType = await this.loanTypeRepository.findByName(name);
    if (existingLoanType) {
      throw new BadRequestException(
        `Ya existe un tipo de préstamo con el nombre "${name}"`,
      );
    }

    const newLoanType = await this.loanTypeRepository.createLoanType({
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

    return { loanTypeId: newLoanType.id };
  }
}
