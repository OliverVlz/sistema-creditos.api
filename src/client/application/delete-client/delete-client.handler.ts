import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ClientRepository } from '../../infrastructure/repositories/client.repository';

import { DeleteClientCommand } from './delete-client.command';

@CommandHandler(DeleteClientCommand)
export class DeleteClientHandler implements ICommandHandler<DeleteClientCommand> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(command: DeleteClientCommand) {
    return this.clientRepository.remove(command.id);
  }
}
