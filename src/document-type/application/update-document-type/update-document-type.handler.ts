import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateDocumentTypeCommand } from './update-document-type.command';
import { DocumentTypeRepository } from '../../infrastructure/repositories/document-type.repository';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateDocumentTypeCommand)
export class UpdateDocumentTypeHandler implements ICommandHandler<UpdateDocumentTypeCommand> {
  constructor(private readonly documentTypeRepository: DocumentTypeRepository) {}

  async execute(command: UpdateDocumentTypeCommand): Promise<any> {
    const { 
      id, 
      code, 
      name, 
      description, 
      mimeTypes, 
      maxFileSize, 
      validationRules, 
      isActive, 
      displayOrder, 
      updatedBy 
    } = command;

    if (code) {
      const existingDocumentType = await this.documentTypeRepository.findByCode(code);
      if (existingDocumentType && existingDocumentType.id !== id) {
        throw new BadRequestException(`DocumentType with code "${code}" already exists`);
      }
    }

    const updatedDocumentType = await this.documentTypeRepository.updateDocumentType(id, {
      code,
      name,
      description,
      mimeTypes,
      maxFileSize,
      validationRules,
      isActive,
      displayOrder,
      updatedBy,
    });

    return { documentTypeId: updatedDocumentType.id };
  }
}
