import { registerAs } from '@nestjs/config';

import { ensureEnvVar, validateNumberEnvVar } from './env-variable.utils';

export type ApiConfig = {
  env: string;
  port: number;
  webBaseUrl: string;
  mailLogoUrl: string;
  massiveImportTemplateUrl: string;
  passwordRecoveryTime: string;
  logger: {
    lokiEnabled: boolean;
    lokiHost?: string;
    lokiSuffixApp?: string;
  };
};

export default registerAs('api', (): ApiConfig => {
  const lokiEnabled = process.env.LOKI_ENABLED === 'true';
  const lokiSuffixApp = process.env.LOKI_SUFFIX_APP || '';
  const webBaseUrl = ensureEnvVar('WEB_BASE_URL');

  return {
    env: process.env.NODE_ENV || 'development',
    port: validateNumberEnvVar('PORT', 3001) as number,
    webBaseUrl,
    mailLogoUrl: process.env.MAIL_LOGO_URL || `${webBaseUrl}/assets/logo-color.png`,
    massiveImportTemplateUrl:
      process.env.MASSIVE_IMPORT_TEMPLATE_URL ||
      `${webBaseUrl}/assets/Plantilla-subida-masiva.xlsx`,
    passwordRecoveryTime: process.env.PASSWORD_RECOVERY_EXPIRATION || '15min',
    logger: {
      lokiEnabled,
      lokiHost: lokiEnabled ? ensureEnvVar('LOKI_HOST') : undefined,
      lokiSuffixApp,
    },
  };
});
