import { registerAs } from '@nestjs/config';
import { createTransport } from 'nodemailer';

import { MailModuleOptions } from 'src/shared/mail';

import { validateNumberEnvVar } from './env-variable.utils';

export default registerAs('mail', (): MailModuleOptions => {
  const port = validateNumberEnvVar('MAIL_PORT', 2525);
  const resendFrom = process.env.RESEND_FROM || 'onboarding@resend.dev';
  const resendReplyTo = process.env.RESEND_REPLY_TO || 'olierel12@gmail.com';
  const mailFrom = process.env.MAIL_FROM || resendFrom;
  const mailHost = process.env.MAIL_HOST || '';
  const mailUser = process.env.MAIL_USER || '';
  const mailPassword = process.env.MAIL_PASSWORD || '';

  return {
    transport: createTransport({
      port,
      host: mailHost,
      from: mailFrom,
      secure: port === 465,
      auth: {
        user: mailUser,
        pass: mailPassword,
      },
      tls: { rejectUnauthorized: false },
    }),
    mailgunConfig: {
      url: process.env.MAIL_API_URL,
      auth: {
        username: 'api',
        password: process.env.MAIL_API_PASSWORD,
      },
    },
    resendConfig: {
      apiKey: process.env.RESEND_API_KEY || '',
      from: resendFrom,
      replyTo: resendReplyTo,
    },
  };
});
