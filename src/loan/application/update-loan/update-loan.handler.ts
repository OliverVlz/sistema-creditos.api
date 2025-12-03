import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanCommand } from './update-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { LoanDocumentRepository } from 'src/loan-document/infrastructure/repositories/loan-document.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';

@CommandHandler(UpdateLoanCommand)
export class UpdateLoanHandler implements ICommandHandler<UpdateLoanCommand> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: UpdateLoanCommand): Promise<any> {
    const { id, status, rejectionReason, managerId, documents } = command;

    const existingLoan = await this.loanRepository.findOne(id);
    if (!existingLoan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    if (status === LoanStatus.RECHAZADO && !rejectionReason) {
      throw new BadRequestException(
        'Se requiere una razón de rechazo para rechazar el préstamo',
      );
    }

    if (managerId) {
      const manager = await this.userRepository.findById(managerId);
      if (!manager) {
        throw new NotFoundException(
          `Usuario gestor con ID ${managerId} no encontrado`,
        );
      }
    }

    const updateData = {
      ...(status && { status }),
      ...(rejectionReason && { rejectionReason }),
      ...(managerId && { manager: { id: managerId } }),
      ...(status && { managedAt: new Date() }),
    };

    const updatedLoan = await this.loanRepository.updateLoan(id, updateData);

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await this.loanDocumentRepository.update(doc.id, doc.url);
      }
    }

    return { loanId: updatedLoan.id };
  }
}
