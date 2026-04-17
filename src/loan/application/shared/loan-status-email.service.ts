import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiConfig } from 'src/config/api.config';
import { MailService, renderTemplate } from 'src/shared/mail';
import {
  LoanStatusEmailTemplate,
  LoanStatusTemplateData,
} from './loan-status-email.template';

type LoanStatusEmailPayload = {
  email: string;
  firstName?: string;
  loanNumber: string;
  details?: string;
};

@Injectable()
export class LoanStatusEmailService {
  private readonly companyContactEmail =
    'atencion.cliente@inversionesmurillomartinez.com';
  private readonly apiConfig: ApiConfig;

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {
    this.apiConfig = this.configService.get('api');
  }

  async sendPreapprovedEmail(payload: LoanStatusEmailPayload) {
    const subject = `Solicitud preaprobada ${payload.loanNumber}`;
    const html = this.buildTemplate({
      title: 'Solicitud preaprobada',
      greeting: this.buildGreeting(payload.firstName),
      intro:
        'Validamos tu información y tu solicitud quedó preaprobada. Adjuntamos el formato en PDF que debes firmar para continuar.',
      details: payload.details,
      steps: [
        'Descarga y revisa el PDF adjunto.',
        'Firma el contrato físicamente.',
        'Envía el documento firmado por transportadora a Calle 25 N 12-27 110110 Bogotá, Colombia.',
        'El costo del envío es asumido por el cliente y no se acepta contraentrega.',
      ],
      finalMessage:
        'Cuando completemos este paso, podremos confirmar la aprobación definitiva de tu solicitud.',
    });
    const text = [
      `${this.buildGreetingText(payload.firstName)}`,
      `Tu solicitud ${payload.loanNumber} fue preaprobada.`,
      payload.details ? `Detalle: ${payload.details}` : '',
      'Pasos para continuar:',
      '1) Descarga y revisa el PDF adjunto.',
      '2) Firma el contrato físicamente.',
      '3) Envía el documento por transportadora a Calle 25 N 12-27 110110 Bogotá, Colombia.',
      'El costo del envío es asumido por el cliente y no se acepta contraentrega.',
      `Si tienes dudas escríbenos a ${this.companyContactEmail}.`,
    ]
      .filter(Boolean)
      .join('\n');

    await this.mailService.sendMail({
      to: payload.email,
      subject,
      html,
      text,
      attachments: this.buildPreapprovalAttachments(),
    });
  }

  async sendApprovedEmail(payload: LoanStatusEmailPayload) {
    const subject = `Solicitud aprobada ${payload.loanNumber}`;
    const html = this.buildTemplate({
      title: 'Solicitud aprobada',
      greeting: this.buildGreeting(payload.firstName),
      intro:
        'Tu solicitud fue aprobada de forma definitiva. Nuestro equipo ya está gestionando el siguiente paso operativo.',
      details: payload.details,
      steps: [
        'Tu dinero ya va en camino.',
        'Recibirás cualquier actualización adicional por este mismo canal.',
      ],
      finalMessage: `Si necesitas soporte, escríbenos a ${this.companyContactEmail}.`,
    });
    const text = [
      `${this.buildGreetingText(payload.firstName)}`,
      `Tu solicitud ${payload.loanNumber} fue aprobada.`,
      payload.details ? `Detalle: ${payload.details}` : '',
      'Tu dinero ya va en camino.',
      `Si necesitas soporte, escríbenos a ${this.companyContactEmail}.`,
    ]
      .filter(Boolean)
      .join('\n');

    await this.mailService.sendMail({
      to: payload.email,
      subject,
      html,
      text,
    });
  }

  async sendRejectedEmail(payload: LoanStatusEmailPayload) {
    const subject = `Solicitud rechazada ${payload.loanNumber}`;
    const html = this.buildTemplate({
      title: 'Solicitud rechazada',
      greeting: this.buildGreeting(payload.firstName),
      intro:
        'Tu solicitud no pudo ser aprobada en esta revisión. Revisa el motivo de rechazo.',
      detailsLabel: 'Motivo de rechazo',
      details: payload.details || 'No especificado',
      steps: [
        'Ingresa a la plataforma con tu cuenta.',
        'Dirígete a la sección de solicitudes y revisa el motivo de rechazo.',
        'Realiza las correcciones solicitadas y actualiza la información requerida.',
      ],
      finalMessage: 'Podrás presentar una nueva solicitud cuando tengas la documentación requerida.',
    });
    const text = [
      `${this.buildGreetingText(payload.firstName)}`,
      `Tu solicitud ${payload.loanNumber} fue rechazada.`,
      `Motivo: ${payload.details || 'No especificado'}`,
      'Ingresa a la plataforma con tu cuenta.',
      'Dirígete a la sección de solicitudes y revisa el motivo de rechazo.',
      'Realiza las correcciones solicitadas y actualiza la información requerida.',
      'Podrás presentar una nueva solicitud cuando tengas la documentación requerida.',
      `Si tienes dudas, escríbenos a ${this.companyContactEmail}.`,
    ].join('\n');

    await this.mailService.sendMail({
      to: payload.email,
      subject,
      html,
      text,
    });
  }

  async sendPreapprovalReminderEmail(payload: LoanStatusEmailPayload) {
    const subject = `Recordatorio solicitud preaprobada ${payload.loanNumber}`;
    const html = this.buildTemplate({
      title: 'Recordatorio de preaprobación',
      greeting: this.buildGreeting(payload.firstName),
      intro:
        'Te recordamos que tu solicitud continúa en preaprobación y debes completar el envío del documento firmado.',
      details: payload.details,
      steps: [
        'Revisa el PDF adjunto.',
        'Firma el contrato físicamente.',
        'Envía el documento firmado por transportadora a Calle 25 N 12-27 110110 Bogotá, Colombia.',
      ],
      finalMessage:
        'Si ya realizaste el envío, nuestro equipo validará la recepción para continuar con el proceso.',
    });

    await this.mailService.sendMail({
      to: payload.email,
      subject,
      html,
      attachments: this.buildPreapprovalAttachments(),
    });
  }

  private buildGreeting(firstName?: string) {
    if (!firstName) {
      return 'Hola,';
    }

    return `Hola ${this.escapeHtml(firstName)},`;
  }

  private buildGreetingText(firstName?: string) {
    if (!firstName) {
      return 'Hola,';
    }

    return `Hola ${firstName},`;
  }

  private buildTemplate(
    data: Omit<LoanStatusTemplateData, 'contactEmail' | 'logoUrl'>,
  ) {
    return renderTemplate(LoanStatusEmailTemplate, {
      data: {
        ...data,
        contactEmail: this.companyContactEmail,
        logoUrl: this.apiConfig.mailLogoUrl,
      },
    });
  }

  private buildPreapprovalAttachments() {
    if (!this.apiConfig?.loanContractTemplateUrl) {
      return [];
    }

    return [
      {
        filename: 'Formato-contrato-firma.pdf',
        path: this.apiConfig.loanContractTemplateUrl,
      },
    ];
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
