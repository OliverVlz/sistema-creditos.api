import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../entity/loan.entity';
import { DomainError } from 'src/shared/domain';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';

type CreateLoanData = Omit<Partial<Loan>, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  loanNumber: string;
  clientId: string;
  organizationId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  createdBy: string;
};

type UpdateLoanData = Omit<Partial<Loan>, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'createdBy'>;

type LoanSearchData = {
  terms?: string;
  page?: number;
  limit?: number;
  clientId?: string;
  organizationId?: string;
  status?: LoanStatus;
  startDateFrom?: string;
  startDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
};

@Injectable()
export class LoanRepository {
  constructor(
    @InjectRepository(Loan)
    private loansRepository: Repository<Loan>,
  ) {}

  async create(loan: CreateLoanData) {
    const createdLoan = this.loansRepository.create(loan);
    return this.loansRepository.save(createdLoan);
  }

  async findAll() {
    const loans = await this.loansRepository.find({
      relations: ['client', 'organization', 'creator', 'updater', 'approver'],
      order: { createdAt: 'DESC' },
    });
    return loans;
  }

  async findOne(id: string) {
    const loan = await this.loansRepository.findOne({ 
      where: { id },
      relations: ['client', 'organization', 'creator', 'updater', 'approver']
    });
    if (!loan) {
      throw new DomainError('LOAN_NOT_FOUND', 'Loan not found');
    }
    return loan;
  }

  async update(id: string, loan: UpdateLoanData) {
    await this.loansRepository.update(id, loan);
    return this.findOne(id);
  }

  async softDelete(id: string, deletedBy: string) {
    // First check if loan exists
    const loan = await this.findOne(id);
    
    // Update the loan with soft delete information
    await this.loansRepository.update(id, {
      updatedBy: deletedBy,
    });
    
    // Perform soft delete
    const deleteResult = await this.loansRepository.softDelete(id);
    if (deleteResult.affected === 0) {
      throw new DomainError('LOAN_NOT_FOUND', 'Loan not found');
    }
  }

  async findByLoanNumber(loanNumber: string) {
    const loan = await this.loansRepository.findOne({ 
      where: { loanNumber },
      relations: ['client', 'organization']
    });
    return loan;
  }

  async searchLoansWithPagination(searchData: LoanSearchData) {
    const queryBuilder = this.loansRepository.createQueryBuilder('loan')
      .leftJoinAndSelect('loan.client', 'client')
      .leftJoinAndSelect('loan.organization', 'organization')
      .leftJoinAndSelect('loan.creator', 'creator')
      .leftJoinAndSelect('loan.updater', 'updater')
      .leftJoinAndSelect('loan.approver', 'approver');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        `(LOWER(loan.loanNumber) LIKE :term OR LOWER(client.firstName) LIKE :term OR LOWER(client.lastName) LIKE :term OR LOWER(client.documentNumber) LIKE :term)`,
        { term: `%${term}%` }
      );
    }

    if (searchData.clientId) {
      queryBuilder.andWhere('loan.clientId = :clientId', { 
        clientId: searchData.clientId 
      });
    }

    if (searchData.organizationId) {
      queryBuilder.andWhere('loan.organizationId = :organizationId', { 
        organizationId: searchData.organizationId 
      });
    }

    if (searchData.status) {
      queryBuilder.andWhere('loan.status = :status', { 
        status: searchData.status 
      });
    }

    if (searchData.startDateFrom) {
      queryBuilder.andWhere('loan.startDate >= :startDateFrom', { 
        startDateFrom: searchData.startDateFrom 
      });
    }

    if (searchData.startDateTo) {
      queryBuilder.andWhere('loan.startDate <= :startDateTo', { 
        startDateTo: searchData.startDateTo 
      });
    }

    if (searchData.createdDateFrom) {
      queryBuilder.andWhere('loan.createdAt >= :createdDateFrom', { 
        createdDateFrom: searchData.createdDateFrom 
      });
    }

    if (searchData.createdDateTo) {
      queryBuilder.andWhere('loan.createdAt <= :createdDateTo', { 
        createdDateTo: searchData.createdDateTo 
      });
    }

    queryBuilder.orderBy('loan.createdAt', 'DESC');

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

  async generateLoanNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `LOAN-${currentYear}-`;
    
    // Find the last loan number for this year
    const lastLoan = await this.loansRepository
      .createQueryBuilder('loan')
      .where('loan.loanNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('loan.loanNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastLoan) {
      const lastNumber = lastLoan.loanNumber.split('-').pop();
      nextNumber = parseInt(lastNumber || '0') + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }
}
