import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DocumentType } from '../entity/document-type.entity';

type CreateDocumentTypeData = {
  code: string;
  name: string;
};

type UpdateDocumentTypeData = {
  code?: string;
  name?: string;
  isActive?: boolean;
};

@Injectable()
export class DocumentTypeRepository {
  constructor(
    @InjectRepository(DocumentType)
    private documentTypesRepository: Repository<DocumentType>,
  ) {}

  async create(data: CreateDocumentTypeData): Promise<DocumentType> {
    const newDocumentType = this.documentTypesRepository.create(data);
    return this.documentTypesRepository.save(newDocumentType);
  }

  async findOne(id: string): Promise<DocumentType> {
    const documentType = await this.documentTypesRepository.findOne({
      where: { id },
    });
    if (!documentType) {
      throw new NotFoundException(
        `Tipo de documento con ID ${id} no encontrado`,
      );
    }
    return documentType;
  }

  async findByCode(code: string): Promise<DocumentType | undefined> {
    return this.documentTypesRepository.findOne({ where: { code } });
  }

  async findByCodes(codes: string[]): Promise<DocumentType[]> {
    return this.documentTypesRepository.find({
      where: { code: In(codes) },
    });
  }

  async findAll(): Promise<DocumentType[]> {
    return this.documentTypesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    data: UpdateDocumentTypeData,
  ): Promise<DocumentType> {
    await this.documentTypesRepository.update(id, data);
    return this.findOne(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.documentTypesRepository.update(id, { isActive: false });
  }
}
