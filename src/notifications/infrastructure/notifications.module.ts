import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { Notification } from './entity/notification.entity';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationsController } from './notifications.controller';
import { IdentityModule } from 'src/identity/infrastructure/identity.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification]),
    IdentityModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
