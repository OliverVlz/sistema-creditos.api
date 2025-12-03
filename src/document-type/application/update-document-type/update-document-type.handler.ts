import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateDocumentTypeCommand } from './update-document-type.command';
import { DocumentTypeRepository } from '../../infrastructure/repositories/document-type.repository';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateDocumentTypeCommand)
export class UpdateDocumentTypeHandler
  implements ICommandHandler<UpdateDocumentTypeCommand>
{
  constructor(
    private readonly documentTypeRepository: DocumentTypeRepository,
  ) {}

  async execute(command: UpdateDocumentTypeCommand): Promise<any> {
    const { id, code, name, isActive } = command;

    if (code) {
      const existingDocumentType =
        await this.documentTypeRepository.findByCode(code);
      if (existingDocumentType && existingDocumentType.id !== id) {
        throw new BadRequestException(
          `Ya existe un tipo de documento con el código "${code}"`,
        );
      }
    }

    await this.documentTypeRepository.findOne(id);

    const updatedDocumentType = await this.documentTypeRepository.update(id, {
      code,
      name,
      isActive,
    });

    return { documentTypeId: updatedDocumentType.id };
  }
}
