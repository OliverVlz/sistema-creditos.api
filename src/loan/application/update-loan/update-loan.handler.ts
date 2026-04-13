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
import { NotificationsService } from 'src/notifications/infrastructure/notifications.service';
import { UserRole } from 'src/shared/enums';
import { LoanStatusEmailService } from '../shared/loan-status-email.service';

@CommandHandler(UpdateLoanCommand)
export class UpdateLoanHandler implements ICommandHandler<UpdateLoanCommand> {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly userRepository: UserRepository,
    private readonly notificationsService: NotificationsService,
    private readonly loanStatusEmailService: LoanStatusEmailService,
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

    if (
      status === LoanStatus.APROBADO &&
      existingLoan.status !== LoanStatus.PREAPROBADO &&
      existingLoan.status !== LoanStatus.APROBADO
    ) {
      throw new BadRequestException(
        'Solo se puede aprobar una solicitud que ya esté preaprobada',
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

    // Obtener datos del manager si existe
    let managerData = null;
    if (managerId) {
      const manager = await this.userRepository.findById(managerId);
      managerData = manager;
    } else if (existingLoan.manager) {
      managerData = existingLoan.manager;
    }

    // Solo actualizar datos del préstamo si es admin/asesor
    let updatedLoan = existingLoan;
    const previousStatus = existingLoan.status;
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

    // Send notifications based on action and role
    const clientName =
      existingLoan.client?.user?.firstName &&
      existingLoan.client?.user?.lastName
        ? `${existingLoan.client.user.firstName} ${existingLoan.client.user.lastName}`
        : 'Cliente';
    const clientEmail = existingLoan.client?.user?.email;

    if (isClient && documents && documents.length > 0) {
      // Client modified their loan after rejection
      this.notificationsService.notifyLoanModifiedByClient({
        loanId: updatedLoan.id,
        loanNumber: updatedLoan.loanNumber,
        clientId: existingLoan.client.user?.id || '',
        clientName,
        status: updatedLoan.status,
        amountRequested: updatedLoan.amountRequested,
        timestamp: new Date(),
      });
    } else if (isAdminOrAdvisor && status) {
      // Admin/Advisor changed the status
      const notificationData = {
        loanId: updatedLoan.id,
        loanNumber: updatedLoan.loanNumber,
        clientId: existingLoan.client.user?.id || '',
        clientName,
        status: updatedLoan.status,
        amountRequested: updatedLoan.amountRequested,
        rejectionReason: updatedLoan.rejectionReason,
        managerId: managerData?.id,
        managerName: managerData
          ? `${managerData.firstName} ${managerData.lastName}`
          : undefined,
        timestamp: new Date(),
      };

      if (status === LoanStatus.PREAPROBADO && previousStatus !== status) {
        this.notificationsService.notifyLoanPreapproved(notificationData);
        if (clientEmail) {
          await this.loanStatusEmailService.sendPreapprovedEmail({
            email: clientEmail,
            firstName: existingLoan.client?.user?.firstName,
            loanNumber: updatedLoan.loanNumber,
            details: updatedLoan.rejectionReason || undefined,
          });
        }
      } else if (status === LoanStatus.APROBADO && previousStatus !== status) {
        this.notificationsService.notifyLoanApproved(notificationData);
        if (clientEmail) {
          await this.loanStatusEmailService.sendApprovedEmail({
            email: clientEmail,
            firstName: existingLoan.client?.user?.firstName,
            loanNumber: updatedLoan.loanNumber,
            details: updatedLoan.rejectionReason || undefined,
          });
        }
      } else if (status === LoanStatus.RECHAZADO && previousStatus !== status) {
        this.notificationsService.notifyLoanRejected(notificationData);
        if (clientEmail) {
          await this.loanStatusEmailService.sendRejectedEmail({
            email: clientEmail,
            firstName: existingLoan.client?.user?.firstName,
            loanNumber: updatedLoan.loanNumber,
            details: updatedLoan.rejectionReason || undefined,
          });
        }
      } else {
        this.notificationsService.notifyLoanUpdated(notificationData);
      }
    }

    return { loanId: updatedLoan.id };
  }
}
