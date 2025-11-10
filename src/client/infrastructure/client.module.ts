import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsController } from './client.controller';
import { Client } from './entity/client.entity';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { ClientRepository } from './repositories/client.repository';
import { CreateClientHandler } from '../application/create-client/create-client.handler';
import { DeleteClientHandler } from '../application/delete-client/delete-client.handler';
import { UpdateClientHandler } from '../application/update-client/update-client.handler';
import { GetUsersClientInfoHandler } from '../application/get-users-client-info/get-users-client-info.handler';
import { GetUsersClientInfoByIdHandler } from '../application/get-users-client-info-by-id/get-users-client-info-by-id.handler';

import { IdentityModule } from 'src/identity/infrastructure/identity.module';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Client, User]),
    forwardRef(() => IdentityModule),
  ],
  controllers: [ClientsController],
  providers: [
    ClientRepository,
    CreateClientHandler,
    DeleteClientHandler,
    UpdateClientHandler,
    GetUsersClientInfoHandler,
    GetUsersClientInfoByIdHandler,
  ],
  exports: [ClientRepository, TypeOrmModule],
})
export class ClientsModule {}
