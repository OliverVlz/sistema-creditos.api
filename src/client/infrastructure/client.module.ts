import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsController } from './client.controller';
import { Client } from './entity/client.entity';
import { ClientRepository } from './repositories/client.repository';
import { CreateClientHandler } from '../application/create-client/create-client.handler';
import { DeleteClientHandler } from '../application/delete-client/delete-client.handler';
import { GetClientByIdHandler } from '../application/get-client-by-id/get-client-by-id.handler';
import { GetClientsHandler } from '../application/get-clients/get-clients.handler';
import { UpdateClientHandler } from '../application/update-client/update-client.handler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Client])
  ],
  controllers: [ClientsController],
  providers: [
    ClientRepository,
    CreateClientHandler,
    DeleteClientHandler,
    GetClientByIdHandler,
    GetClientsHandler,
    UpdateClientHandler,
  ],
  exports: [ClientRepository, TypeOrmModule],
})
export class ClientsModule {}
