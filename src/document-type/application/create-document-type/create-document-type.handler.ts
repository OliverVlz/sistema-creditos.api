import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateDocumentTypeCommand } from './create-document-type.command';
import { DocumentTypeRepository } from '../../infrastructure/repositories/document-type.repository';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateDocumentTypeCommand)
export class CreateDocumentTypeHandler
  implements ICommandHandler<CreateDocumentTypeCommand>
{
  constructor(private readonly documentTypeRepository: DocumentTypeRepository) {}

  async execute(command: CreateDocumentTypeCommand): Promise<any> {
    const { name } = command;

    const existingDocumentType =
      await this.documentTypeRepository.findByName(name);
    if (existingDocumentType) {
      throw new BadRequestException(
        `Ya existe un tipo de documento con el nombre "${name}"`,
      );
    }

    const newDocumentType = await this.documentTypeRepository.create({ name });

    return { documentTypeId: newDocumentType.id };
  }
}
