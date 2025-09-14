import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanType } from '../entity/loan-type.entity';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';

type CreateLoanTypeData = Omit<Partial<LoanType>, 'id' | 'createdAt' | 'updatedAt'> & {
  name: string;
  description: string;
  baseProcessingFee: number;
  maxAmount: number;
  minAmount: number;
  maxTermMonths: number;
  isActive: boolean;
  createdBy: string;
};

type UpdateLoanTypeData = Partial<Omit<LoanType, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> & {
  updatedBy?: string; // Add updatedBy for auditoría
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
    const newLoanType = this.loanTypesRepository.create(data);
    return this.loanTypesRepository.save(newLoanType);
  }

  async findOne(id: string): Promise<LoanType> {
    const loanType = await this.loanTypesRepository.findOne({ where: { id } });
    if (!loanType) {
      throw new NotFoundException(`LoanType with ID ${id} not found`);
    }
    return loanType;
  }

  async findByName(name: string): Promise<LoanType | undefined> {
    return this.loanTypesRepository.findOne({ where: { name } });
  }

  async updateLoanType(id: string, updateData: UpdateLoanTypeData): Promise<LoanType> {
    await this.loanTypesRepository.update(id, updateData);
    return this.findOne(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.loanTypesRepository.update(id, { isActive: false });
  }

  async searchLoanTypesWithPagination(searchData: LoanTypeSearchData) {
    const queryBuilder = this.loanTypesRepository.createQueryBuilder('loanType');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        `(LOWER(loanType.name) LIKE :term OR LOWER(loanType.description) LIKE :term)`,
        { term: `%${term}%` }
      );
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('loanType.isActive = :isActive', { isActive: searchData.isActive });
    }

    queryBuilder.orderBy('loanType.createdAt', 'DESC');

    const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
      searchData.page,
      searchData.limit,
    );

    queryBuilder
      .skip(paginationOptions.offset)
      .take(paginationOptions.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return PaginationUtils.createPaginatedResult(
      { data, total },
      paginationOptions,
    );
  }
}

