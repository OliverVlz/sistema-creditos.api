import { registerAs } from '@nestjs/config';
import { createTransport } from 'nodemailer';

import { MailModuleOptions } from 'src/shared/mail';

import { ensureEnvVar, validateNumberEnvVar } from './env-variable.utils';

export default registerAs('mail', (): MailModuleOptions => {
  const port = validateNumberEnvVar('MAIL_PORT', 2525);

  return {
    transport: createTransport({
      port,
      host: ensureEnvVar('MAIL_HOST'),
      from: ensureEnvVar('MAIL_FROM'),
      secure: port === 465,
      auth: {
        user: ensureEnvVar('MAIL_USER'),
        pass: ensureEnvVar('MAIL_PASSWORD'),
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
  };
});
