import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { LoanStatus } from 'src/loan/infrastructure/entity/loan.entity';
import { NotificationRepository } from './repositories/notification.repository';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';

export enum NotificationType {
  LOAN_CREATED = 'loan:created',
  LOAN_PREAPPROVED = 'loan:preapproved',
  LOAN_APPROVED = 'loan:approved',
  LOAN_REJECTED = 'loan:rejected',
  LOAN_UPDATED = 'loan:updated',
  LOAN_MODIFIED_BY_CLIENT = 'loan:modified_by_client',
}

export interface LoanNotificationData {
  loanId: string;
  loanNumber: string;
  clientId: string;
  clientName: string;
  status: LoanStatus;
  amountRequested: number;
  rejectionReason?: string;
  managerId?: string;
  managerName?: string;
  timestamp: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  private async saveNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data: any,
  ) {
    try {
      await this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to save notification for user ${userId}`,
        error.stack,
      );
    }
  }

  private async saveNotificationForAdmins(
    type: string,
    title: string,
    message: string,
    data: any,
  ) {
    try {
      const admins = await this.userRepository.findAdminsAndAdvisors();
      for (const admin of admins) {
        await this.saveNotification(admin.id, type, title, message, data);
      }
    } catch (error) {
      this.logger.error(`Failed to save notification for admins`, error.stack);
    }
  }

  /**
   * Notify when a client creates a new loan application
   */
  async notifyLoanCreated(data: LoanNotificationData) {
    this.logger.log(`Notifying loan created: ${data.loanNumber}`);

    const adminMsg = `Nueva solicitud de crédito ${data.loanNumber} de ${data.clientName}`;
    const userMsg = `Tu solicitud de crédito ${data.loanNumber} ha sido creada exitosamente`;

    // Save to DB
    await this.saveNotificationForAdmins(
      NotificationType.LOAN_CREATED,
      'Nueva Solicitud',
      adminMsg,
      data,
    );
    await this.saveNotification(
      data.clientId,
      NotificationType.LOAN_CREATED,
      'Solicitud Creada',
      userMsg,
      data,
    );

    // Notify admins and advisors
    this.notificationsGateway.sendToAdmins(NotificationType.LOAN_CREATED, {
      type: NotificationType.LOAN_CREATED,
      message: adminMsg,
      data,
    });

    // Also notify the client who created it
    this.notificationsGateway.sendToUser(
      data.clientId,
      NotificationType.LOAN_CREATED,
      {
        type: NotificationType.LOAN_CREATED,
        message: userMsg,
        data,
      },
    );
  }

  /**
   * Notify when an admin/advisor preapproves a loan
   */
  async notifyLoanPreapproved(data: LoanNotificationData) {
    this.logger.log(`Notifying loan preapproved: ${data.loanNumber}`);

    const userMsg = `Tu solicitud de crédito ${data.loanNumber} fue preaprobada`;
    const adminMsg = `Crédito ${data.loanNumber} preaprobado por ${data.managerName}`;

    await this.saveNotification(
      data.clientId,
      NotificationType.LOAN_PREAPPROVED,
      'Solicitud Preaprobada',
      userMsg,
      data,
    );
    await this.saveNotificationForAdmins(
      NotificationType.LOAN_PREAPPROVED,
      'Solicitud Preaprobada',
      adminMsg,
      data,
    );

    this.notificationsGateway.sendToUser(
      data.clientId,
      NotificationType.LOAN_PREAPPROVED,
      {
        type: NotificationType.LOAN_PREAPPROVED,
        message: userMsg,
        data,
      },
    );

    this.notificationsGateway.sendToAdmins(NotificationType.LOAN_PREAPPROVED, {
      type: NotificationType.LOAN_PREAPPROVED,
      message: adminMsg,
      data,
    });
  }

  /**
   * Notify when an admin/advisor approves a loan
   */
  async notifyLoanApproved(data: LoanNotificationData) {
    this.logger.log(`Notifying loan approved: ${data.loanNumber}`);

    const userMsg = `¡Felicitaciones! Tu solicitud de crédito ${data.loanNumber} ha sido aprobada`;
    const adminMsg = `Crédito ${data.loanNumber} aprobado por ${data.managerName}`;

    // Save to DB
    await this.saveNotification(
      data.clientId,
      NotificationType.LOAN_APPROVED,
      'Solicitud Aprobada',
      userMsg,
      data,
    );
    await this.saveNotificationForAdmins(
      NotificationType.LOAN_APPROVED,
      'Solicitud Aprobada',
      adminMsg,
      data,
    );

    // Notify the client
    this.notificationsGateway.sendToUser(
      data.clientId,
      NotificationType.LOAN_APPROVED,
      {
        type: NotificationType.LOAN_APPROVED,
        message: userMsg,
        data,
      },
    );

    // Also notify admins
    this.notificationsGateway.sendToAdmins(NotificationType.LOAN_APPROVED, {
      type: NotificationType.LOAN_APPROVED,
      message: adminMsg,
      data,
    });
  }

  /**
   * Notify when an admin/advisor rejects a loan
   */
  async notifyLoanRejected(data: LoanNotificationData) {
    this.logger.log(`Notifying loan rejected: ${data.loanNumber}`);

    const userMsg = `Tu solicitud de crédito ${data.loanNumber} ha sido rechazada`;
    const adminMsg = `Crédito ${data.loanNumber} rechazado por ${data.managerName}`;

    // Save to DB
    await this.saveNotification(
      data.clientId,
      NotificationType.LOAN_REJECTED,
      'Solicitud Rechazada',
      userMsg,
      data,
    );
    await this.saveNotificationForAdmins(
      NotificationType.LOAN_REJECTED,
      'Solicitud Rechazada',
      adminMsg,
      data,
    );

    // Notify the client
    this.notificationsGateway.sendToUser(
      data.clientId,
      NotificationType.LOAN_REJECTED,
      {
        type: NotificationType.LOAN_REJECTED,
        message: userMsg,
        data,
      },
    );

    // Also notify admins
    this.notificationsGateway.sendToAdmins(NotificationType.LOAN_REJECTED, {
      type: NotificationType.LOAN_REJECTED,
      message: adminMsg,
      data,
    });
  }

  /**
   * Notify when a client modifies their loan after rejection
   */
  async notifyLoanModifiedByClient(data: LoanNotificationData) {
    this.logger.log(`Notifying loan modified by client: ${data.loanNumber}`);

    const adminMsg = `El cliente ${data.clientName} ha modificado la solicitud ${data.loanNumber}`;
    const userMsg = `Tu solicitud de crédito ${data.loanNumber} ha sido modificada exitosamente`;

    // Save to DB
    await this.saveNotificationForAdmins(
      NotificationType.LOAN_MODIFIED_BY_CLIENT,
      'Solicitud Modificada',
      adminMsg,
      data,
    );
    await this.saveNotification(
      data.clientId,
      NotificationType.LOAN_MODIFIED_BY_CLIENT,
      'Solicitud Modificada',
      userMsg,
      data,
    );

    // Notify admins and advisors
    this.notificationsGateway.sendToAdmins(
      NotificationType.LOAN_MODIFIED_BY_CLIENT,
      {
        type: NotificationType.LOAN_MODIFIED_BY_CLIENT,
        message: adminMsg,
        data,
      },
    );

    // Also notify the client
    this.notificationsGateway.sendToUser(
      data.clientId,
      NotificationType.LOAN_MODIFIED_BY_CLIENT,
      {
        type: NotificationType.LOAN_MODIFIED_BY_CLIENT,
        message: userMsg,
        data,
      },
    );
  }

  /**
   * Generic loan update notification
   */
  async notifyLoanUpdated(data: LoanNotificationData) {
    this.logger.log(`Notifying loan updated: ${data.loanNumber}`);

    const userMsg = `Tu solicitud de crédito ${data.loanNumber} ha sido actualizada`;

    // Save to DB
    await this.saveNotification(
      data.clientId,
      NotificationType.LOAN_UPDATED,
      'Solicitud Actualizada',
      userMsg,
      data,
    );

    // Notify the client
    this.notificationsGateway.sendToUser(
      data.clientId,
      NotificationType.LOAN_UPDATED,
      {
        type: NotificationType.LOAN_UPDATED,
        message: userMsg,
        data,
      },
    );
  }
}
