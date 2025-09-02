import { DynamicModule, Global, Module } from '@nestjs/common';

import { MAIL_OPTIONS } from './mail.constants';
import { MailModuleRootAsyncOptions } from './mail.types';
import { MailService } from './mail.service';

@Global()
@Module({})
export class MailModule {
  static forRootAsync(options: MailModuleRootAsyncOptions): DynamicModule {
    return {
      ...options,
      module: MailModule,
      imports: options.imports,
      providers: [
        MailService,
        {
          provide: MAIL_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
      ],
      exports: [MailService],
    };
  }
}
