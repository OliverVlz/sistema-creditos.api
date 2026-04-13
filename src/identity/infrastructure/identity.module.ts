import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HashService } from 'src/shared/hash';
import { ClientRouteBuilder } from 'src/shared/utils';

import { CreateUserHandler } from '../application/create-user/create-user.handler';
import { LoginHandler } from '../application/login/login.handler';
import { GetUsersHandler } from '../application/get-users/get-users.handler';
import { RecoverPasswordHandler } from '../application/recover-password/recover-password.handler';
import { ResetPasswordHandler } from '../application/reset-password/reset-password.handler';
import { UpdatePasswordHandler } from '../application/update-password/update-password.handler';
import { UpdatePasswordAdminHandler } from '../application/update-password-admin/update-password-admin.handler';
import { UpdateUserProfileHandler } from '../application/update-user-profile/update-user-profile.handler';
import { UpdateUserAdminHandler } from '../application/update-user-admin/update-user-admin.handler';
import { GetUserByIdHandler } from '../application/get-user-by-id/get-user-by-id.handler';
import { GetMeHandler } from '../application/get-me/get-me.handler';
import { DeleteUserAdminHandler } from '../application/delete-user-admin/delete-user-admin.handler';

import { User } from './entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './auth.service';
import { UsersController } from './users.controller';
import { ClientsModule } from 'src/client/infrastructure/client.module';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '12h' },
      }),
    }),
    TypeOrmModule.forFeature([User, Client]),
    forwardRef(() => ClientsModule),
  ],
  controllers: [UsersController],
  providers: [
    AuthService,
    ClientRouteBuilder,
    CreateUserHandler,
    GetUsersHandler,
    HashService,
    LoginHandler,
    RecoverPasswordHandler,
    ResetPasswordHandler,
    UpdatePasswordHandler,
    UpdatePasswordAdminHandler,
    UpdateUserProfileHandler,
    UpdateUserAdminHandler,
    GetUserByIdHandler,
    GetMeHandler,
    DeleteUserAdminHandler,
    UserRepository,
  ],
  exports: [UserRepository, HashService],
})
export class IdentityModule {}
