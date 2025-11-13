import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from '../entity/document-type.entity';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';

type CreateDocumentTypeData = Omit<
  Partial<DocumentType>,
  'id' | 'createdAt' | 'updatedAt'
> & {
  code: string;
  name: string;
};

type UpdateDocumentTypeData = Partial<
  Omit<DocumentType, 'id' | 'createdAt' | 'updatedAt'>
> & {
  updatedBy?: string;
};

type DocumentTypeSearchData = {
  terms?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
};

@Injectable()
export class DocumentTypeRepository {
  constructor(
    @InjectRepository(DocumentType)
    private documentTypesRepository: Repository<DocumentType>,
  ) {}

  async createDocumentType(
    data: CreateDocumentTypeData,
  ): Promise<DocumentType> {
    const newDocumentType = this.documentTypesRepository.create(data);
    return this.documentTypesRepository.save(newDocumentType);
  }

  async findOne(id: string): Promise<DocumentType> {
    const documentType = await this.documentTypesRepository.findOne({
      where: { id },
      relations: [],
    });
    if (!documentType) {
      throw new NotFoundException(`DocumentType with ID ${id} not found`);
    }
    return documentType;
  }

  async findByCode(code: string): Promise<DocumentType | undefined> {
    return this.documentTypesRepository.findOne({ where: { code } });
  }

  async updateDocumentType(
    id: string,
    updateData: UpdateDocumentTypeData,
  ): Promise<DocumentType> {
    await this.documentTypesRepository.update(id, updateData);
    return this.findOne(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.documentTypesRepository.update(id, { isActive: false });
  }

  async searchDocumentTypesWithPagination(searchData: DocumentTypeSearchData) {
    const queryBuilder =
      this.documentTypesRepository.createQueryBuilder('documentType');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        `(LOWER(documentType.code) LIKE :term OR LOWER(documentType.name) LIKE :term OR LOWER(documentType.description) LIKE :term)`,
        { term: `%${term}%` },
      );
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('documentType.isActive = :isActive', {
        isActive: searchData.isActive,
      });
    }

    queryBuilder
      .orderBy('documentType.displayOrder', 'ASC')
      .addOrderBy('documentType.createdAt', 'DESC');

    const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
      searchData.page,
      searchData.limit,
    );

    queryBuilder.skip(paginationOptions.offset).take(paginationOptions.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return PaginationUtils.createPaginatedResult(
      { data, total },
      paginationOptions,
    );
  }

  async findAllActive(): Promise<DocumentType[]> {
    return this.documentTypesRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }
}
