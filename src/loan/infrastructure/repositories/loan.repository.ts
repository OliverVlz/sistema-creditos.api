import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from '../entity/loan.entity';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';
import { DeepPartial } from 'src/shared/types/utility.types';

type CreateLoanData = {
  loanNumber: string;
  client: { id: string };
  loanType: { id: string };
  organization: { id: string };
  amountRequested: number;
  termMonths: number;
  appliedInterestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  status: LoanStatus;
};

type UpdateLoanData = DeepPartial<Loan>; // Cambiado a DeepPartial<Loan>

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
    const lastLoan = await this.loansRepository.find({
      order: { createdAt: 'DESC' },
      take: 1,
      select: ['loanNumber'],
    });
    if (lastLoan.length > 0) {
      const lastNumber = parseInt(lastLoan[0].loanNumber.split('-')[1]);
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
      relations: [
        'client',
        'client.user',
        'loanType',
        'organization',
        'manager',
        'documents',
        'documents.documentType',
      ],
    });
    if (!loan) {
      throw new NotFoundException('Préstamo no encontrado');
    }
    return loan;
  }

  async searchLoansWithPagination(searchData: LoanSearchData) {
    const queryBuilder = this.loansRepository
      .createQueryBuilder('loan')
      .leftJoinAndSelect('loan.client', 'client')
      .leftJoinAndSelect('client.user', 'clientUser')
      .leftJoinAndSelect('loan.loanType', 'loanType')
      .leftJoinAndSelect('loan.organization', 'organization')
      .leftJoinAndSelect('loan.manager', 'manager');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(`(LOWER(loan.loanNumber) LIKE :term)`, {
        term: `%${term}%`,
      });
    }

    if (searchData.clientId) {
      queryBuilder.andWhere('loan.client.id = :clientId', {
        clientId: searchData.clientId,
      });
    }

    if (searchData.loanTypeId) {
      queryBuilder.andWhere('loan.loanType.id = :loanTypeId', {
        loanTypeId: searchData.loanTypeId,
      });
    }

    if (searchData.organizationId) {
      queryBuilder.andWhere('loan.organization.id = :organizationId', {
        organizationId: searchData.organizationId,
      });
    }

    if (searchData.loanNumber) {
      queryBuilder.andWhere('LOWER(loan.loanNumber) LIKE :loanNumber', {
        loanNumber: `%${searchData.loanNumber.toLowerCase()}%`,
      });
    }

    if (searchData.status) {
      queryBuilder.andWhere('loan.status = :status', {
        status: searchData.status,
      });
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('loan.isActive = :isActive', {
        isActive: searchData.isActive,
      });
    }

    queryBuilder.orderBy('loan.createdAt', 'DESC');

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
