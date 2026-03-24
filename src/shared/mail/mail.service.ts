import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data';
import { Transporter, SendMailOptions } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { firstValueFrom } from 'rxjs';

import { MAIL_OPTIONS } from './mail.constants';
import { EmailTemplate, MailModuleOptions } from './mail.types';

type AllowedMethod = 'post' | 'POST';
type TransportOptions = Mail.Options & SMTPTransport.Options;
enum MailServiceMethod {
  sendMail = 'sendMail',
  postToMailgun = 'postToMailgun',
}

@Injectable()
export class MailService {
  private readonly transporter: Transporter;
  private readonly mailgunConfig: MailModuleOptions['mailgunConfig'];
  private readonly resendConfig: MailModuleOptions['resendConfig'];
  private readonly handledErrors = {
    errno: -4078,
    codes: ['ECONNREFUSED', 'ESOCKET'],
  };

  constructor(
    @Inject(MAIL_OPTIONS) options: MailModuleOptions,
    private httpService: HttpService,
  ) {
    this.transporter = options.transport;
    this.mailgunConfig = options.mailgunConfig;
    this.resendConfig = options.resendConfig;
  }

  async sendMail(content: SendMailOptions | EmailTemplate) {
    if (this.hasResendConfig()) {
      const payload = await this.bundlePayload(content);
      return this.sendToResend(payload);
    }

    if (this.isConfigMissing(MailServiceMethod.sendMail)) {
      return;
    }

    return this.transporter
      .sendMail(await this.bundlePayload(content))
      .catch(e => this.handleError(e));
  }

  async postToMailgun(content: any) {
    if (this.isConfigMissing(MailServiceMethod.postToMailgun)) {
      return;
    }

    content = this.bundlePayload(content);
    const data = new FormData();
    for (const key in content) {
      data.append(key, content[key]);
    }

    return this.makeRequest('POST', data);
  }

  private isConfigMissing(method: MailServiceMethod): boolean {
    let config: any[];
    switch (method) {
      case MailServiceMethod.sendMail:
        const { host, port, from } = this.transporter
          .options as TransportOptions;
        config = [host, port, from];
        break;
      case MailServiceMethod.postToMailgun:
        const { url, auth } = this.mailgunConfig;
        config = [url, auth.username, auth.password];
        break;
    }

    if (config.every(Boolean)) {
      return false;
    } else {
      console.warn('Email not sent, mail env variables missing');
      return true;
    }
  }

  private async bundlePayload(content: any) {
    const isTemplate = typeof content?.build === 'function';
    const from = this.resolveFrom();
    return {
      ...(isTemplate ? await content.build() : content),
      from,
    };
  }

  private resolveFrom() {
    const transportFrom = this.transporter.options.from;
    if (transportFrom) {
      return transportFrom;
    }

    if (this.resendConfig.from) {
      return this.resendConfig.from;
    }

    return '';
  }

  private hasResendConfig() {
    const { apiKey, from } = this.resendConfig;
    return Boolean(apiKey && from);
  }

  private async sendToResend(content: SendMailOptions) {
    const to = this.normalizeRecipients(content.to);
    const cc = this.normalizeRecipients(content.cc);
    const bcc = this.normalizeRecipients(content.bcc);

    if (to.length === 0) {
      return;
    }

    const payload = {
      from: String(content.from),
      to,
      subject: content.subject ? String(content.subject) : '',
      html: content.html ? String(content.html) : '',
      text: content.text ? String(content.text) : undefined,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      reply_to: this.resendConfig.replyTo,
    };

    const request = this.httpService.post('https://api.resend.com/emails', payload, {
      headers: {
        Authorization: `Bearer ${this.resendConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return firstValueFrom(request)
      .then(response => response.data)
      .catch(e => this.handleError(e));
  }

  private normalizeRecipients(to: SendMailOptions['to']) {
    if (!to) {
      return [];
    }

    if (typeof to === 'string') {
      return [to];
    }

    if (Array.isArray(to)) {
      return to
        .map(item => {
          if (typeof item === 'string') {
            return item;
          }

          if (item && 'address' in item && item.address) {
            return item.address;
          }

          return '';
        })
        .filter(Boolean);
    }

    if (typeof to === 'object' && 'address' in to && to.address) {
      return [to.address];
    }

    return [];
  }

  private async makeRequest(method: AllowedMethod, data: FormData) {
    const request = this.httpService.request({
      method,
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...data.getHeaders(),
      },
      ...this.mailgunConfig,
    });

    return firstValueFrom(request)
      .then(response => response.data)
      .catch(e => this.handleError(e));
  }

  private handleError(error: any): void {
    if (
      error.errno === this.handledErrors.errno ||
      this.handledErrors.codes.includes(error.code)
    ) {
      console.error(
        'Connection to email server was refused or timed out. Email not sent.',
      );
    } else {
      console.error('MailService Error');
      throw error;
    }
  }
}
