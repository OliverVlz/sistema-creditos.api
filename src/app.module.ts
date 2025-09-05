import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';

import apiConfig from './config/api.config';
import corsConfig from './config/cors.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import recaptchaConfig from './config/recaptcha.config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientRouteBuilder } from './shared/utils';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { MailModule } from './shared/mail';
import { IdentityModule } from './identity/infrastructure/identity.module';
import { ClientsModule } from './client/infrastructure/client.module';
import { OrganizationModule } from './organization/infrastructure/organization.module';
import { LoanModule } from './loan/infrastructure/loan.module';
import { JwtStrategy } from './shared/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        apiConfig,
        corsConfig,
        databaseConfig,
        jwtConfig,
        mailConfig,
        recaptchaConfig,
      ],
    }),
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('recaptcha'),
    }),
    IdentityModule,
    ClientsModule,
    OrganizationModule,
    LoanModule,
    MailModule.forRootAsync({
      imports: [ConfigModule, HttpModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('mail'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database'),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: ClientRouteBuilder,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new ClientRouteBuilder(config),
    },
  ],
})
export class AppModule {}
