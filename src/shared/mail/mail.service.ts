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
  }

  async sendMail(content: SendMailOptions | EmailTemplate) {
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
    return {
      ...(isTemplate ? await content.build() : content),
      from: this.transporter.options.from,
    };
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
