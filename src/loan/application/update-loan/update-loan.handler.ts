import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanCommand } from './update-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { LoanDocumentRepository } from 'src/loan-document/infrastructure/repositories/loan-document.repository';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { UserRole } from 'src/shared/enums';

@CommandHandler(UpdateLoanCommand)
export class UpdateLoanHandler implements ICommandHandler<UpdateLoanCommand> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: UpdateLoanCommand): Promise<any> {
    const {
      id,
      status,
      rejectionReason,
      managerId,
      updatedBy,
      updatedByRole,
      documents,
    } = command;

    const existingLoan = await this.loanRepository.findOne(id);
    if (!existingLoan) {
      throw new NotFoundException(`Préstamo con ID ${id} no encontrado`);
    }

    // Validar permisos según rol
    const isClient = updatedByRole === UserRole.CLIENTE;
    const isAdminOrAdvisor =
      updatedByRole === UserRole.ADMIN || updatedByRole === UserRole.ASESOR;

    if (isClient) {
      // Cliente solo puede modificar SUS préstamos
      if (existingLoan.client?.user?.id !== updatedBy) {
        throw new ForbiddenException(
          'No tienes permiso para modificar este préstamo',
        );
      }

      // Cliente NO puede cambiar status, rejectionReason ni managerId
      if (status || rejectionReason || managerId) {
        throw new ForbiddenException(
          'No tienes permiso para modificar el estado del préstamo',
        );
      }
    }

    // Solo Admin/Asesor pueden cambiar status
    if ((status || rejectionReason || managerId) && !isAdminOrAdvisor) {
      throw new ForbiddenException(
        'Solo administradores o asesores pueden modificar el estado del préstamo',
      );
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

    // Solo actualizar datos del préstamo si es admin/asesor
    let updatedLoan = existingLoan;
    if (isAdminOrAdvisor) {
      const updateData = {
        ...(status && { status }),
        ...(rejectionReason && { rejectionReason }),
        ...(managerId && { manager: { id: managerId } }),
        ...(status && { managedAt: new Date() }),
      };

      if (Object.keys(updateData).length > 0) {
        updatedLoan = await this.loanRepository.updateLoan(id, updateData);
      }
    }

    // Actualizar documentos (permitido para todos)
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await this.loanDocumentRepository.update(doc.id, doc.url);
      }
    }

    return { loanId: updatedLoan.id };
  }
}
