import {
  Injectable,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiConfig } from 'src/config/api.config';
import { MailService, renderTemplate } from 'src/shared/mail';
import type { MailModuleOptions } from 'src/shared/mail/mail.types';

import { ContactSubmissionDto } from './dto/contact-submission.dto';
import { ContactSubmissionTemplate } from './contact-submission.template';

@Injectable()
export class ContactService {
  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async submitContact(dto: ContactSubmissionDto): Promise<{ message: string }> {
    const mailOptions = this.configService.get<MailModuleOptions>('mail');
    const apiConfig = this.configService.get<ApiConfig>('api');
    const to = mailOptions.contactNotificationEmail?.trim();

    if (!to) {
      throw new ServiceUnavailableException(
        'El servicio de contacto no está disponible en este momento.',
      );
    }

    const subject = `Mensaje desde la web — ${dto.nombre}`;
    const html = renderTemplate(ContactSubmissionTemplate, {
      data: {
        nombre: dto.nombre,
        telefono: dto.telefono,
        email: dto.email,
        mensaje: dto.mensaje,
        logoUrl: apiConfig?.mailLogoUrl,
      },
    });

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
}
