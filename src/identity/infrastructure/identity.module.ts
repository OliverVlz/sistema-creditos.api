import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HashService } from 'src/shared/hash';
import { ClientRouteBuilder } from 'src/shared/utils';

import { CreateUserHandler } from '../application/create-user/create-user.handler';
import { LoginHandler } from '../application/login/login.handler';
import { GetUsersHandler } from '../application/get-users/get-users.handler';
import { GetUsersWithClientInfoHandler } from '../application/get-users-with-client-info/get-users-with-client-info.handler';
import { GetClientInfoByIdHandler } from '../application/get-client-info-by-id/get-client-info-by-id.handler';
import { RecoverPasswordHandler } from '../application/recover-password/recover-password.handler';

import { User } from './entity/user.entity';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './auth.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    JwtModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController],
  providers: [
    AuthService,
    ClientRouteBuilder,
    CreateUserHandler,
    GetUsersHandler,
    GetUsersWithClientInfoHandler,
  GetClientInfoByIdHandler,
    HashService,
    LoginHandler,
    RecoverPasswordHandler,
    UserRepository,
  ],
  exports: [UserRepository, HashService],
})
export class IdentityModule {}
