import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data';
import { Transporter, SendMailOptions } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { firstValueFrom } from 'rxjs';
import { promises as fs } from 'fs';
import { basename } from 'path';
import { Readable } from 'stream';

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
  private readonly logger = new Logger(MailService.name);
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
      this.logger.warn('Email not sent, mail env variables missing');
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

    const attachments = await this.normalizeAttachmentsForResend(
      content.attachments,
    );

    const payload = {
      from: String(content.from),
      to,
      subject: content.subject ? String(content.subject) : '',
      html: content.html ? String(content.html) : '',
      text: content.text ? String(content.text) : undefined,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      reply_to:
        this.resolveReplyToForResend(content) || this.resendConfig.replyTo,
      attachments: attachments.length > 0 ? attachments : undefined,
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

  private async normalizeAttachmentsForResend(
    attachments: SendMailOptions['attachments'],
  ) {
    if (!attachments || attachments.length === 0) {
      return [];
    }

    const results: Array<{ filename: string; content: string }> = [];

    for (const attachment of attachments) {
      const fileName = this.resolveAttachmentFileName(attachment);
      if (!fileName) {
        continue;
      }

      let contentBase64 = '';

      try {
        if (attachment.content) {
          contentBase64 = await this.normalizeAttachmentContent(
            attachment.content,
            attachment.encoding,
          );
        } else if (attachment.path) {
          contentBase64 = await this.readAttachmentPathAsBase64(
            String(attachment.path),
          );
        }
      } catch (error) {
        this.logger.warn(
          `No se pudo preparar adjunto "${fileName}" para Resend. Se enviará correo sin este adjunto.`,
          error instanceof Error ? error.stack : String(error),
        );
        continue;
      }

      if (!contentBase64) {
        continue;
      }

      results.push({
        filename: fileName,
        content: contentBase64,
      });
    }

    return results;
  }

  private resolveAttachmentFileName(attachment: Mail.Attachment) {
    if (attachment.filename) {
      return String(attachment.filename);
    }

    if (attachment.path) {
      return basename(String(attachment.path));
    }

    return 'adjunto.pdf';
  }

  private async normalizeAttachmentContent(
    content: Mail.Attachment['content'],
    encoding?: string,
  ) {
    if (!content) {
      return '';
    }

    if (Buffer.isBuffer(content)) {
      return content.toString('base64');
    }

    if (typeof content === 'string') {
      if (encoding === 'base64') {
        return content;
      }
      return Buffer.from(content, encoding as BufferEncoding | undefined).toString(
        'base64',
      );
    }

    if (Array.isArray(content)) {
      const chunks: Buffer[] = [];
      for (const item of content) {
        if (Buffer.isBuffer(item)) {
          chunks.push(item);
          continue;
        }
        if (typeof item === 'string') {
          chunks.push(Buffer.from(item));
        }
      }
      return Buffer.concat(chunks).toString('base64');
    }

    if (this.isReadableStream(content)) {
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        content.on('data', chunk => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        content.on('end', () => resolve());
        content.on('error', reject);
      });
      return Buffer.concat(chunks).toString('base64');
    }

    return '';
  }

  private async readAttachmentPathAsBase64(pathOrUrl: string) {
    const isUrl = /^https?:\/\//i.test(pathOrUrl);
    if (isUrl) {
      const request = this.httpService.get(pathOrUrl, {
        responseType: 'arraybuffer',
      });
      const response = await firstValueFrom(request);
      return Buffer.from(response.data).toString('base64');
    }

    const fileBuffer = await fs.readFile(pathOrUrl);
    return fileBuffer.toString('base64');
  }

  private isReadableStream(value: unknown): value is Readable {
    return value instanceof Readable;
  }

  private resolveReplyToForResend(content: SendMailOptions): string | undefined {
    const r = content.replyTo;
    if (!r) {
      return undefined;
    }
    if (typeof r === 'string') {
      return r;
    }
    if (Array.isArray(r)) {
      const first = r[0];
      if (typeof first === 'string') {
        return first;
      }
      if (first && typeof first === 'object' && 'address' in first) {
        return first.address;
      }
    }
    if (typeof r === 'object' && r !== null && 'address' in r) {
      return (r as { address: string }).address;
    }
    return undefined;
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
      this.logger.error(
        'Connection to email server was refused or timed out. Email not sent.',
      );
    } else {
      const status = error?.response?.status;
      const body = error?.response?.data;
      const detail =
        body !== undefined
          ? typeof body === 'string'
            ? body
            : JSON.stringify(body)
          : error?.message || String(error);
      this.logger.error(
        status !== undefined
          ? `MailService Error HTTP ${status}: ${detail}`
          : `MailService Error: ${detail}`,
      );
      throw error;
    }
  }
}
