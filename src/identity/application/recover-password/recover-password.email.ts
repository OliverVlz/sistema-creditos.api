import { DEFAULT_LANGUAGE, Language } from 'src/shared/enums';
import {
  EmailTemplate,
  EmailTemplateProps,
  MailContent,
  renderTemplate,
} from 'src/shared/mail';

import {
  RecoverPasswordTemplate,
  translations,
} from './recover-password.template';

export class RecoverPasswordEmail implements EmailTemplate {
  private readonly email: string;
  private readonly lang: Language;
  private readonly data: Record<string, unknown>;

  constructor(params: EmailTemplateProps) {
    this.email = params.email;
    this.lang = params.lang || DEFAULT_LANGUAGE;
    this.data = params.data;
  }

  async build(): MailContent {
    return {
      to: this.email,
      subject: translations[this.lang].subject,
      html: renderTemplate(RecoverPasswordTemplate, {
        lang: this.lang,
        data: this.data,
      }),
    };
  }
}
