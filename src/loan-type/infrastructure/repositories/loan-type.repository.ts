import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanType } from '../entity/loan-type.entity';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';

type CreateLoanTypeData = {
  name: string;
  description?: string;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  isActive?: boolean;
  requiredDocumentTypeIds?: string[];
};

type UpdateLoanTypeData = Partial<
  Omit<LoanType, 'id' | 'createdAt' | 'updatedAt' | 'requiredDocuments'>
> & {
  updatedBy?: string;
  requiredDocumentTypeIds?: string[];
};

type LoanTypeSearchData = {
  terms?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
};

@Injectable()
export class LoanTypeRepository {
  constructor(
    @InjectRepository(LoanType)
    private loanTypesRepository: Repository<LoanType>,
  ) {}

  async createLoanType(data: CreateLoanTypeData): Promise<LoanType> {
    const { requiredDocumentTypeIds, ...loanData } = data;
    const newLoanType = this.loanTypesRepository.create(loanData);

    if (requiredDocumentTypeIds && requiredDocumentTypeIds.length > 0) {
      newLoanType.requiredDocuments = requiredDocumentTypeIds.map(
        id => ({ id }) as any,
      );
    }

    return this.loanTypesRepository.save(newLoanType);
  }

  async findOne(id: string): Promise<LoanType> {
    const loanType = await this.loanTypesRepository.findOne({
      where: { id },
      relations: ['requiredDocuments'],
    });
    if (!loanType) {
      throw new NotFoundException(`LoanType with ID ${id} not found`);
    }
    return loanType;
  }

  async findByName(name: string): Promise<LoanType | undefined> {
    return this.loanTypesRepository.findOne({ where: { name } });
  }

  async updateLoanType(
    id: string,
    updateData: UpdateLoanTypeData,
  ): Promise<LoanType> {
    const { requiredDocumentTypeIds, ...data } = updateData;
    const loanType = await this.findOne(id);

    this.loanTypesRepository.merge(loanType, data);

    if (requiredDocumentTypeIds) {
      loanType.requiredDocuments = requiredDocumentTypeIds.map(
        docId => ({ id: docId }) as any,
      );
    }

    return this.loanTypesRepository.save(loanType);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.loanTypesRepository.update(id, { isActive: false });
  }

  async searchLoanTypesWithPagination(searchData: LoanTypeSearchData) {
    const queryBuilder =
      this.loanTypesRepository.createQueryBuilder('loanType');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        `(LOWER(loanType.name) LIKE :term OR LOWER(loanType.description) LIKE :term)`,
        { term: `%${term}%` },
      );
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('loanType.isActive = :isActive', {
        isActive: searchData.isActive,
      });
    }

    queryBuilder.orderBy('loanType.createdAt', 'DESC');

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
}
