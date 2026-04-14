import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
    const result = await this.loansRepository.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(loan_number FROM 6) AS INTEGER)), 0) AS "maxNumber"
      FROM loans
      WHERE loan_number ~ '^LOAN-[0-9]+$'
    `);
    const currentMax = Number(result?.[0]?.maxNumber || 0);
    return `LOAN-${(currentMax + 1).toString().padStart(6, '0')}`;
  }

  async createLoan(loanData: CreateLoanData): Promise<Loan> {
    const newLoan = this.loansRepository.create(loanData);
    return this.loansRepository.save(newLoan);
  }

  async createLoanWithAutoNumber(
    loanData: Omit<CreateLoanData, 'loanNumber'>,
  ): Promise<Loan> {
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const loanNumber = await this.generateLoanNumber();
      try {
        return await this.createLoan({ ...loanData, loanNumber });
      } catch (error: any) {
        if (this.isDuplicateLoanNumberError(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new InternalServerErrorException(
      'No se pudo generar un número de préstamo único',
    );
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
      queryBuilder.andWhere(
        `(LOWER(loan.loanNumber) LIKE :term OR LOWER(clientUser.documentNumber) LIKE :term OR LOWER(CONCAT_WS(' ', clientUser.firstName, clientUser.lastName)) LIKE :term OR LOWER(CONCAT_WS(' ', clientUser.lastName, clientUser.firstName)) LIKE :term)`,
        {
        term: `%${term}%`,
        },
      );
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
      const loanNumberTerm = searchData.loanNumber.toLowerCase().trim();
      queryBuilder.andWhere(
        `(LOWER(loan.loanNumber) LIKE :loanNumber OR LOWER(clientUser.documentNumber) LIKE :loanNumber OR LOWER(CONCAT_WS(' ', clientUser.firstName, clientUser.lastName)) LIKE :loanNumber OR LOWER(CONCAT_WS(' ', clientUser.lastName, clientUser.firstName)) LIKE :loanNumber)`,
        {
          loanNumber: `%${loanNumberTerm}%`,
        },
      );
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

  private isDuplicateLoanNumberError(error: any): boolean {
    const duplicateCode = error?.code === '23505';
    const duplicateConstraint =
      error?.constraint === 'UQ_2c3924c4f76a8318dabc7f23d8b';
    const duplicateDetail = String(error?.detail || '').includes('(loan_number)');
    return duplicateCode && (duplicateConstraint || duplicateDetail);
  }
}
