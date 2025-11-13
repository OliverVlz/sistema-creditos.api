import {
  EmailTemplate,
  EmailTemplateProps,
  MailContent,
  renderTemplate,
} from 'src/shared/mail';

import {
  RecoverPasswordTemplate,
} from './recover-password.template';

export class RecoverPasswordEmail implements EmailTemplate {
  private readonly email: string;
  private readonly data: Record<string, unknown>;

  constructor(params: EmailTemplateProps) {
    this.email = params.email;
    this.data = params.data;
  }

  async build(): MailContent {
    return {
      to: this.email,
      subject: 'Restablecer contraseña',
      html: renderTemplate(RecoverPasswordTemplate, {
        data: this.data,
      }),
    };
  }
}
