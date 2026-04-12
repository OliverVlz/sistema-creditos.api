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

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const resolveMinioPublicBaseUrl = (): string => {
  const configuredBaseUrl = (process.env.MINIO_PUBLIC_BASE_URL || '').trim();
  if (configuredBaseUrl) {
    return trimTrailingSlashes(configuredBaseUrl);
  }
  return '';
};

const resolvePublicObjectUrl = (
  explicitUrl: string | undefined,
  objectKey: string,
  webBaseUrl: string,
): string => {
  const configuredUrl = (explicitUrl || '').trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  const minioBaseUrl = resolveMinioPublicBaseUrl();
  if (!minioBaseUrl) {
    return `${webBaseUrl}/assets/${objectKey.split('/').pop()}`;
  }

  const publicBucket = (process.env.MINIO_PUBLIC_BUCKET || 'public').trim();
  const normalizedBucket = publicBucket.replace(/^\/+|\/+$/g, '');
  const normalizedKey = objectKey.replace(/^\/+/, '');
  return `${minioBaseUrl}/${normalizedBucket}/${normalizedKey}`;
};

export default registerAs('api', (): ApiConfig => {
  const lokiEnabled = process.env.LOKI_ENABLED === 'true';
  const lokiSuffixApp = process.env.LOKI_SUFFIX_APP || '';
  const webBaseUrl = ensureEnvVar('WEB_BASE_URL');
  const mailLogoObjectKey = process.env.MAIL_LOGO_OBJECT_KEY || 'branding/logo-color.png';
  const massiveImportTemplateObjectKey =
    process.env.MASSIVE_IMPORT_TEMPLATE_OBJECT_KEY ||
    'branding/Plantilla-subida-masiva.xlsx';

  return {
    env: process.env.NODE_ENV || 'development',
    port: validateNumberEnvVar('PORT', 3001) as number,
    webBaseUrl,
    mailLogoUrl: resolvePublicObjectUrl(
      process.env.MAIL_LOGO_URL,
      mailLogoObjectKey,
      webBaseUrl,
    ),
    massiveImportTemplateUrl: resolvePublicObjectUrl(
      process.env.MASSIVE_IMPORT_TEMPLATE_URL,
      massiveImportTemplateObjectKey,
      webBaseUrl,
    ),
    passwordRecoveryTime: process.env.PASSWORD_RECOVERY_EXPIRATION || '15min',
    logger: {
      lokiEnabled,
      lokiHost: lokiEnabled ? ensureEnvVar('LOKI_HOST') : undefined,
      lokiSuffixApp,
    },
  };
});
