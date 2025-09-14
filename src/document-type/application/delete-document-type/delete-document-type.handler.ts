import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteDocumentTypeCommand } from './delete-document-type.command';
import { DocumentTypeRepository } from '../../infrastructure/repositories/document-type.repository';

@CommandHandler(DeleteDocumentTypeCommand)
export class DeleteDocumentTypeHandler implements ICommandHandler<DeleteDocumentTypeCommand> {
  constructor(private readonly documentTypeRepository: DocumentTypeRepository) {}

  async execute(command: DeleteDocumentTypeCommand): Promise<void> {
    const { id, deletedBy } = command;

    await this.documentTypeRepository.softDelete(id, deletedBy);
  }
}
