import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsController } from './client.controller';
import { Client } from './entity/client.entity';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { ClientRepository } from './repositories/client.repository';
import { CreateClientHandler } from '../application/create-client/create-client.handler';
import { UpdateClientProfileHandler } from '../application/update-client-profile/update-client-profile.handler';
import { UpdateClientAdminHandler } from '../application/update-client-admin/update-client-admin.handler';
import { GetClientsHandler } from '../application/get-clients/get-clients.handler';
import { GetClientByIdHandler } from '../application/get-client-by-id/get-client-by-id.handler';
import { ImportClientsLoansHandler } from '../application/import-clients-loans/import-clients-loans.handler';

import { IdentityModule } from 'src/identity/infrastructure/identity.module';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    TypeOrmModule.forFeature([Client, User]),
    forwardRef(() => IdentityModule),
  ],
  controllers: [ClientsController],
  providers: [
    ClientRepository,
    CreateClientHandler,
    UpdateClientProfileHandler,
    UpdateClientAdminHandler,
    GetClientsHandler,
    GetClientByIdHandler,
    ImportClientsLoansHandler,
  ],
  exports: [ClientRepository, TypeOrmModule],
})
export class ClientsModule {}
