import { registerAs } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export default registerAs(
  'cors',
  (): CorsOptions => ({
    origin: process.env.CORS_ORIGINS || '*',
    methods: 'GET,PUT,POST,DELETE,PATCH',
    allowedHeaders: 'Content-Type,Authorization',
  }),
);
