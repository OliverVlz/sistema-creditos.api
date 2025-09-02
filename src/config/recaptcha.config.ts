import { registerAs } from '@nestjs/config';
import { GoogleRecaptchaModuleOptions } from '@nestlab/google-recaptcha/interfaces/google-recaptcha-module-options';

import { ensureEnvVar } from './env-variable.utils';

export default registerAs('recaptcha', (): GoogleRecaptchaModuleOptions => {
  const skipRecaptcha = process.env.RECAPTCHA_ENABLED === 'false';

  return {
    secretKey: skipRecaptcha
      ? 'not-a-secret-key'
      : ensureEnvVar(process.env.RECAPTCHA_SECRET),
    response: req => req.body.recaptcha || req.headers.recaptcha,
    skipIf: skipRecaptcha,
  };
});
