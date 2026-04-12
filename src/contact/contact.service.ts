import {
  Injectable,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from 'src/shared/mail/mail.service';
import type { MailModuleOptions } from 'src/shared/mail/mail.types';

import { ContactSubmissionDto } from './dto/contact-submission.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async submitContact(dto: ContactSubmissionDto): Promise<{ message: string }> {
    const mailOptions = this.configService.get<MailModuleOptions>('mail');
    const to = mailOptions.contactNotificationEmail?.trim();

    if (!to) {
      throw new ServiceUnavailableException(
        'El servicio de contacto no está disponible en este momento.',
      );
    }

    const subject = `Mensaje desde la web — ${dto.nombre}`;
    const safeNombre = this.escapeHtml(dto.nombre);
    const safeTelefono = this.escapeHtml(dto.telefono);
    const safeEmail = dto.email ? this.escapeHtml(dto.email) : '';
    const safeMensaje = dto.mensaje
      ? this.escapeHtml(dto.mensaje).replace(/\n/g, '<br/>')
      : '';

    const html = `
      <p><strong>Nombre:</strong> ${safeNombre}</p>
      <p><strong>Teléfono:</strong> ${safeTelefono}</p>
      ${dto.email ? `<p><strong>Correo:</strong> ${safeEmail}</p>` : ''}
      ${dto.mensaje ? `<p><strong>Mensaje:</strong><br/>${safeMensaje}</p>` : '<p><em>Sin mensaje adicional.</em></p>'}
    `;

    const text = [
      `Nombre: ${dto.nombre}`,
      `Teléfono: ${dto.telefono}`,
      dto.email ? `Correo: ${dto.email}` : '',
      dto.mensaje ? `Mensaje: ${dto.mensaje}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await this.mailService.sendMail({
        to,
        subject,
        html,
        text,
        replyTo: dto.email?.trim() || undefined,
      });
    } catch {
      throw new InternalServerErrorException(
        'No pudimos enviar tu mensaje. Intenta de nuevo más tarde.',
      );
    }

    return { message: 'Tu mensaje fue enviado correctamente.' };
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
