// eslint-disable-next-line @typescript-eslint/no-var-requires
const LokiTransport = require('winston-loki');
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';

import {
  DomainExceptionFilter,
  UnhandledExceptionFilter,
} from './shared/domain';
import { AntdValidationPipe } from './shared/validation';
import { AppModule } from './app.module';
import { ApiConfig } from './config/api.config';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('/api');

  setupSwagger(app);

  const loggerInstance = winston.createLogger(getLoggerConfig(config));
  app.useLogger(WinstonModule.createLogger({ instance: loggerInstance }));

  app
    .useGlobalFilters(
      new DomainExceptionFilter(),
      new UnhandledExceptionFilter(loggerInstance),
    )
    .useGlobalPipes(new AntdValidationPipe({ transform: true }))
    .enableCors(config.get('cors'));

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(config.get('api.port'));
}

function getLoggerConfig(configService: ConfigService) {
  const { logger } = configService.get<ApiConfig>('api');
  const transports = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('App', {
          prettyPrint: true,
          colors: true,
        }),
      ),
      level: 'info',
    }),
  ];

  if (logger?.lokiEnabled) {
    transports.push(
      new LokiTransport({
        host: logger.lokiHost,
        json: true,
        labels: { app: `base_api_${logger.lokiSuffixApp}` },
        format: winston.format.json(),
        replaceTimestamp: true,
        level: 'info',
        onConnectionError: err => console.error(err),
      }) as any,
    );
  }
  return { transports };
}

bootstrap();
