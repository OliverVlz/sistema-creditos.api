import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../entity/loan.entity';
import { DomainError } from 'src/shared/domain';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';
import { NotFoundException } from '@nestjs/common';

type CreateLoanData = {
  loanNumber: string;
  clientId: string;
  loanTypeId: string;
  organizationId: string;
  amountRequested: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  status: LoanStatus;
  createdBy: string;
  notes?: string;
};

type UpdateLoanData = Partial<Pick<Loan, 
  'clientId' |
  'loanTypeId' |
  'organizationId' |
  'amountRequested' |
  'interestRate' |
  'termMonths' |
  'monthlyPayment' |
  'totalAmount' |
  'processingFee' |
  'status' |
  'rejectionReason' |
  'approvedBy' |
  'approvedAt' |
  'signedAt' |
  'disbursedAt' |
  'updatedBy'
>>;

type LoanSearchData = {
  terms?: string;
  page?: number;
  limit?: number;
  clientId?: string;
  loanTypeId?: string;
  organizationId?: string;
  loanNumber?: string;
  status?: LoanStatus;
  isActive?: boolean;
};

@Injectable()
export class LoanRepository {
  constructor(
    @InjectRepository(Loan)
    private loansRepository: Repository<Loan>,
  ) {}

  async generateLoanNumber(): Promise<string> {
    const lastLoan = await this.loansRepository.findOne({ 
      order: { createdAt: 'DESC' },
      select: ['loanNumber']
    });
    if (lastLoan) {
      const lastNumber = parseInt(lastLoan.loanNumber.split('-')[1]);
      return `LOAN-${(lastNumber + 1).toString().padStart(6, '0')}`;
    }
    return 'LOAN-000001';
  }

  async createLoan(loanData: CreateLoanData): Promise<Loan> {
    const newLoan = this.loansRepository.create(loanData);
    return this.loansRepository.save(newLoan);
  }

  async updateLoan(id: string, updateData: UpdateLoanData): Promise<Loan> {
    await this.loansRepository.update(id, updateData);
    return this.findOne(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.loansRepository.softRemove({ id } as Loan);
  }

  async findOne(id: string): Promise<Loan> {
    const loan = await this.loansRepository.findOne({ 
      where: { id },
      relations: ['client', 'loanType', 'organization', 'creator', 'updater', 'approver']
    });
    if (!loan) {
      throw new NotFoundException('Loan not found');
    }
    return loan;
  }

  async searchLoansWithPagination(searchData: LoanSearchData) {
    const queryBuilder = this.loansRepository.createQueryBuilder('loan')
      .leftJoinAndSelect('loan.client', 'client')
      .leftJoinAndSelect('loan.loanType', 'loanType') // Nueva relación
      .leftJoinAndSelect('loan.organization', 'organization')
      .leftJoinAndSelect('loan.creator', 'creator')
      .leftJoinAndSelect('loan.updater', 'updater')
      .leftJoinAndSelect('loan.approver', 'approver');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        `(LOWER(loan.loanNumber) LIKE :term OR LOWER(loan.notes) LIKE :term)`,
        { term: `%${term}%` }
      );
    }

    if (searchData.clientId) {
      queryBuilder.andWhere('loan.clientId = :clientId', { clientId: searchData.clientId });
    }

    if (searchData.loanTypeId) {
      queryBuilder.andWhere('loan.loanTypeId = :loanTypeId', { loanTypeId: searchData.loanTypeId });
    }

    if (searchData.organizationId) {
      queryBuilder.andWhere('loan.organizationId = :organizationId', { organizationId: searchData.organizationId });
    }

    if (searchData.loanNumber) {
      queryBuilder.andWhere('LOWER(loan.loanNumber) LIKE :loanNumber', { loanNumber: `%${searchData.loanNumber.toLowerCase()}%` });
    }

    if (searchData.status) {
      queryBuilder.andWhere('loan.status = :status', { status: searchData.status });
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('loan.isActive = :isActive', { isActive: searchData.isActive });
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
}
