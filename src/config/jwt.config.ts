import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

import { ensureEnvVar } from './env-variable.utils';

export default registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: ensureEnvVar('JWT_SECRET'),
    signOptions: {
      expiresIn: '12h',
    },
  }),
);
