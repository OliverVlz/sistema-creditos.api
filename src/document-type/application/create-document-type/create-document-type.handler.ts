import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateDocumentTypeCommand } from './create-document-type.command';
import { DocumentTypeRepository } from '../../infrastructure/repositories/document-type.repository';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(CreateDocumentTypeCommand)
export class CreateDocumentTypeHandler implements ICommandHandler<CreateDocumentTypeCommand> {
  constructor(private readonly documentTypeRepository: DocumentTypeRepository) {}

  async execute(command: CreateDocumentTypeCommand): Promise<any> {
    const { 
      code, 
      name, 
      description, 
      mimeTypes, 
      maxFileSize, 
      validationRules, 
      isActive, 
      displayOrder 
    } = command;

    const existingDocumentType = await this.documentTypeRepository.findByCode(code);
    if (existingDocumentType) {
      throw new BadRequestException(`DocumentType with code "${code}" already exists`);
    }

    const newDocumentType = await this.documentTypeRepository.createDocumentType({
      code,
      name,
      description,
      mimeTypes: mimeTypes || ['application/pdf'],
      maxFileSize: maxFileSize || 10485760,
      validationRules,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0,
    });

    return { documentTypeId: newDocumentType.id };
  }
}
