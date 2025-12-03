import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateDocumentTypeCommand } from './update-document-type.command';
import { DocumentTypeRepository } from '../../infrastructure/repositories/document-type.repository';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateDocumentTypeCommand)
export class UpdateDocumentTypeHandler
  implements ICommandHandler<UpdateDocumentTypeCommand>
{
  constructor(private readonly documentTypeRepository: DocumentTypeRepository) {}

  async execute(command: UpdateDocumentTypeCommand): Promise<any> {
    const { id, name, isActive } = command;

    if (name) {
      const existingDocumentType =
        await this.documentTypeRepository.findByName(name);
      if (existingDocumentType && existingDocumentType.id !== id) {
        throw new BadRequestException(
          `Ya existe un tipo de documento con el nombre "${name}"`,
        );
      }
    }

    await this.documentTypeRepository.findOne(id);

    const updatedDocumentType = await this.documentTypeRepository.update(id, {
      name,
      isActive,
    });

    return { documentTypeId: updatedDocumentType.id };
  }
}
