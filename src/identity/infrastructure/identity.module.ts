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
import { RecoverPasswordHandler } from '../application/recover-password/recover-password.handler';
import { CreateUserClientHandler } from '../application/create-user-client/create-user-client.handler';
import { CreateUserClientCommand } from '../application/create-user-client/create-user-client.command';

import { User } from './entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';  
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './auth.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    JwtModule,
    TypeOrmModule.forFeature([User, Client, Organization]),
  ],
  controllers: [UsersController],
  providers: [
    AuthService,
    ClientRouteBuilder,
    CreateUserHandler,
    GetUsersHandler,
    CreateUserClientHandler,
    HashService,
    LoginHandler,
    RecoverPasswordHandler,
    UserRepository,
  ],
  exports: [UserRepository, HashService],
})
export class IdentityModule {}
