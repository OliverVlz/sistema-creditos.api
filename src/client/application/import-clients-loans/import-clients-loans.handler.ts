import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { HashService } from 'src/shared/hash';
import { EmploymentStatus, UserRole } from 'src/shared/enums';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Client } from '../../infrastructure/entity/client.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { Loan, LoanStatus } from 'src/loan/infrastructure/entity/loan.entity';
import { LoanType } from 'src/loan-type/infrastructure/entity/loan-type.entity';
import { ImportClientsLoansCommand } from './import-clients-loans.command';
import {
  ClientLoanImportRow,
  parseClientsLoansWorkbook,
} from './import-clients-loans.excel';

type ImportRowResult = {
  rowNumber: number;
  status: 'SUCCESS' | 'ERROR';
  email: string;
  documentNumber: string;
  clientId?: string;
  loanId?: string;
  loanNumber?: string;
  errorCode?: string;
  errorMessage?: string;
};

type ParsedRow = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  phoneNumber: string;
  birthDate: Date;
  address: string;
  employmentStatus: EmploymentStatus;
  organizationName: string;
  loanTypeName: string;
  amountRequested: number;
  termMonths: number;
};

@Injectable()
@CommandHandler(ImportClientsLoansCommand)
export class ImportClientsLoansHandler
  implements ICommandHandler<ImportClientsLoansCommand>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly hashService: HashService,
  ) {}

  async execute(command: ImportClientsLoansCommand) {
    if (!command.file) {
      throw new BadRequestException('Debe adjuntar un archivo Excel');
    }

    const rows = parseClientsLoansWorkbook(command.file.buffer);

    if (!rows.length) {
      throw new UnprocessableEntityException(
        'El archivo no contiene filas para procesar',
      );
    }

    const results: ImportRowResult[] = [];
    const chunkSize = command.chunkSize;

    for (let index = 0; index < rows.length; index += chunkSize) {
      const chunk = rows.slice(index, index + chunkSize);

      for (let chunkIndex = 0; chunkIndex < chunk.length; chunkIndex += 1) {
        const row = chunk[chunkIndex];
        const rowNumber = index + chunkIndex + 2;
        const rowEmail = this.normalizeString(row.email);
        const rowDocumentNumber = this.normalizeString(row.documentNumber);

        try {
          const result = await this.dataSource.transaction(async manager => {
            const parsedRow = this.validateAndNormalizeRow(row, rowNumber);
            return this.processRow(manager, parsedRow);
          });

          results.push({
            rowNumber,
            status: 'SUCCESS',
            email: rowEmail,
            documentNumber: rowDocumentNumber,
            clientId: result.clientId,
            loanId: result.loanId,
            loanNumber: result.loanNumber,
          });
        } catch (error) {
          results.push({
            rowNumber,
            status: 'ERROR',
            email: rowEmail,
            documentNumber: rowDocumentNumber,
            errorCode: this.getErrorCode(error),
            errorMessage: this.getErrorMessage(error),
          });
        }
      }
    }

    const successRows = results.filter(result => result.status === 'SUCCESS').length;
    const errorRows = results.length - successRows;

    return {
      fileName: command.file.originalname,
      totalRows: rows.length,
      processedRows: results.length,
      successRows,
      errorRows,
      results,
    };
  }

  private async processRow(manager: EntityManager, row: ParsedRow) {
    const userRepository = manager.getRepository(User);
    const clientRepository = manager.getRepository(Client);
    const organizationRepository = manager.getRepository(Organization);
    const loanTypeRepository = manager.getRepository(LoanType);
    const loanRepository = manager.getRepository(Loan);

    const organization = await organizationRepository.findOne({
      where: { name: row.organizationName },
      select: ['id', 'name'],
    });

    if (!organization) {
      throw new BadRequestException(
        `La organización "${row.organizationName}" no existe`,
      );
    }

    const loanType = await loanTypeRepository.findOne({
      where: { name: row.loanTypeName },
      select: ['id', 'name', 'interestRate', 'minAmount', 'maxAmount', 'minTerm', 'maxTerm'],
    });

    if (!loanType) {
      throw new BadRequestException(
        `El tipo de préstamo "${row.loanTypeName}" no existe`,
      );
    }

    if (
      row.amountRequested < Number(loanType.minAmount) ||
      row.amountRequested > Number(loanType.maxAmount)
    ) {
      throw new BadRequestException(
        `Monto solicitado fuera de rango para "${row.loanTypeName}"`,
      );
    }

    if (row.termMonths < loanType.minTerm || row.termMonths > loanType.maxTerm) {
      throw new BadRequestException(
        `Plazo fuera de rango para "${row.loanTypeName}"`,
      );
    }

    const emailExists = await userRepository.exists({
      where: { email: row.email },
    });

    if (emailExists) {
      throw new BadRequestException('El email ya existe en el sistema');
    }

    const documentExists = await userRepository.exists({
      where: { documentNumber: row.documentNumber },
    });

    if (documentExists) {
      throw new BadRequestException('El número de documento ya existe en el sistema');
    }

    const hashedPassword = await this.hashService.hash(row.password);

    const user = await userRepository.save(
      userRepository.create({
        email: row.email,
        password: hashedPassword,
        firstName: row.firstName,
        lastName: row.lastName,
        documentNumber: row.documentNumber,
        phoneNumber: row.phoneNumber || null,
        role: UserRole.CLIENTE,
      }),
    );

    const client = await clientRepository.save(
      clientRepository.create({
        user,
        organization,
        address: row.address,
        birthDate: row.birthDate,
        employmentStatus: row.employmentStatus,
      }),
    );

    const calculation = this.calculateLoan(
      row.amountRequested,
      row.termMonths,
      Number(loanType.interestRate),
    );

    const loanNumber = await this.generateLoanNumberWithLock(manager);

    const loan = await loanRepository.save(
      loanRepository.create({
        loanNumber,
        client: { id: client.id },
        loanType: { id: loanType.id },
        organization: { id: organization.id },
        amountRequested: row.amountRequested,
        termMonths: row.termMonths,
        appliedInterestRate: Number(loanType.interestRate),
        monthlyPayment: calculation.monthlyPayment,
        totalInterest: calculation.totalInterest,
        totalPayable: calculation.totalPayable,
        status: LoanStatus.PENDIENTE,
      }),
    );

    return {
      clientId: client.id,
      loanId: loan.id,
      loanNumber: loan.loanNumber,
    };
  }

  private async generateLoanNumberWithLock(manager: EntityManager): Promise<string> {
    await manager.query('LOCK TABLE loans IN EXCLUSIVE MODE');

    const lastLoan = await manager
      .getRepository(Loan)
      .createQueryBuilder('loan')
      .select('loan.loanNumber', 'loanNumber')
      .orderBy('loan.createdAt', 'DESC')
      .limit(1)
      .getRawOne<{ loanNumber?: string }>();

    if (!lastLoan?.loanNumber) {
      return 'LOAN-000001';
    }

    const [, numericPart] = lastLoan.loanNumber.split('-');
    const lastNumber = Number(numericPart || 0);
    return `LOAN-${(lastNumber + 1).toString().padStart(6, '0')}`;
  }

  private calculateLoan(
    amountRequested: number,
    termMonths: number,
    annualInterestRate: number,
  ) {
    const monthlyRate =
      annualInterestRate === 0
        ? 0
        : Math.round((Math.pow(1 + annualInterestRate / 100, 1 / 12) - 1) * 1000000) /
          1000000;

    const monthlyPayment =
      monthlyRate === 0
        ? amountRequested / termMonths
        : (amountRequested *
            (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
          (Math.pow(1 + monthlyRate, termMonths) - 1);

    const roundedMonthlyPayment = Math.round(monthlyPayment * 100) / 100;
    const totalPayable = Math.round(roundedMonthlyPayment * termMonths);
    const totalInterest = Math.round(totalPayable - amountRequested);

    return {
      monthlyPayment: roundedMonthlyPayment,
      totalInterest,
      totalPayable,
    };
  }

  private validateAndNormalizeRow(row: ClientLoanImportRow, rowNumber: number): ParsedRow {
    const email = this.normalizeString(row.email).toLowerCase();
    const password = this.normalizeString(row.password);
    const firstName = this.normalizeString(row.firstName);
    const lastName = this.normalizeString(row.lastName);
    const documentNumber = this.normalizeString(row.documentNumber);
    const phoneNumber = this.normalizeString(row.phoneNumber);
    const address = this.normalizeString(row.address);
    const employmentStatusRaw = this.normalizeString(row.employmentStatus).toUpperCase();
    const organizationName = this.normalizeString(row.organizationName);
    const loanTypeName = this.normalizeString(row.loanTypeName);
    const amountRequested = this.toNumber(row.amountRequested);
    const termMonths = this.toNumber(row.termMonths);
    const birthDate = this.parseBirthDate(row.birthDate);

    if (!email) throw new BadRequestException(`Fila ${rowNumber}: email es requerido`);
    if (!password) throw new BadRequestException(`Fila ${rowNumber}: password es requerido`);
    if (!firstName) throw new BadRequestException(`Fila ${rowNumber}: firstName es requerido`);
    if (!lastName) throw new BadRequestException(`Fila ${rowNumber}: lastName es requerido`);
    if (!documentNumber) {
      throw new BadRequestException(`Fila ${rowNumber}: documentNumber es requerido`);
    }
    if (!address) throw new BadRequestException(`Fila ${rowNumber}: address es requerido`);
    if (!organizationName) {
      throw new BadRequestException(`Fila ${rowNumber}: organizationName es requerido`);
    }
    if (!loanTypeName) {
      throw new BadRequestException(`Fila ${rowNumber}: loanTypeName es requerido`);
    }
    if (!Number.isFinite(amountRequested) || amountRequested <= 0) {
      throw new BadRequestException(
        `Fila ${rowNumber}: amountRequested debe ser un número mayor a 0`,
      );
    }
    if (!Number.isInteger(termMonths) || termMonths <= 0) {
      throw new BadRequestException(
        `Fila ${rowNumber}: termMonths debe ser un entero mayor a 0`,
      );
    }
    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException(
        `Fila ${rowNumber}: birthDate debe tener formato YYYY-MM-DD`,
      );
    }
    if (!this.isValidEmail(email)) {
      throw new BadRequestException(`Fila ${rowNumber}: email no es válido`);
    }
    if (password.length < 8) {
      throw new BadRequestException(
        `Fila ${rowNumber}: password debe tener mínimo 8 caracteres`,
      );
    }

    const employmentStatus = employmentStatusRaw as EmploymentStatus;
    if (!Object.values(EmploymentStatus).includes(employmentStatus)) {
      throw new BadRequestException(
        `Fila ${rowNumber}: employmentStatus debe ser ACTIVO o JUBILADO`,
      );
    }

    return {
      email,
      password,
      firstName,
      lastName,
      documentNumber,
      phoneNumber,
      birthDate,
      address,
      employmentStatus,
      organizationName,
      loanTypeName,
      amountRequested,
      termMonths,
    };
  }

  private parseBirthDate(value: string | number): Date | null {
    if (typeof value === 'number') {
      const utcDays = Math.floor(value - 25569);
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      return new Date(
        Date.UTC(
          dateInfo.getUTCFullYear(),
          dateInfo.getUTCMonth(),
          dateInfo.getUTCDate(),
        ),
      );
    }

    const normalized = this.normalizeString(value);
    if (!normalized) {
      return null;
    }

    const parsedDate = new Date(normalized);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  private toNumber(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }

    const normalized = this.normalizeString(value).replace(/,/g, '');
    return Number(normalized);
  }

  private normalizeString(value: string | number): string {
    return String(value ?? '').trim();
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private getErrorMessage(error: unknown): string {
    const errorWithResponse = error as {
      response?: { message?: string | string[] };
      message?: string;
    };

    const responseMessage = errorWithResponse?.response?.message;
    if (Array.isArray(responseMessage)) {
      return responseMessage.join(', ');
    }
    if (typeof responseMessage === 'string') {
      return responseMessage;
    }

    if (error instanceof Error) {
      return error.message;
    }
    return 'Error inesperado';
  }

  private getErrorCode(error: any): string {
    if (error?.response?.error) {
      return error.response.error;
    }
    if (error?.response?.message && typeof error.response.message === 'string') {
      return error.response.message;
    }
    if (error?.code) {
      return String(error.code);
    }
    return 'IMPORT_ROW_ERROR';
  }
}
