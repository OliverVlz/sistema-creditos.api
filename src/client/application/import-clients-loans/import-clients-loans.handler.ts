import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { HashService } from 'src/shared/hash';
import { EmploymentStatus, SourceType, UserRole } from 'src/shared/enums';
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
import { formatYmdUtc, parseYmdToUtcDate } from 'src/shared/utils/date-only';

type ImportRowResult = {
  rowNumber: number;
  status: 'SUCCESS' | 'ERROR' | 'VALID';
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
  loanTypeName?: string;
  amountRequested?: number;
  termMonths?: number;
  hasLoanRequest: boolean;
};

type ValidatedImportRow = {
  rowNumber: number;
  email: string;
  documentNumber: string;
  row: ParsedRow;
  organization: Pick<Organization, 'id' | 'name'>;
  loanType?: Pick<
    LoanType,
    | 'id'
    | 'name'
    | 'interestRate'
    | 'minAmount'
    | 'maxAmount'
    | 'minTerm'
    | 'maxTerm'
  >;
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

    const validation = await this.validateRows(rows);

    if (validation.hasErrors) {
      return {
        fileName: command.file.originalname,
        totalRows: rows.length,
        processedRows: rows.length,
        successRows: 0,
        errorRows: validation.invalidRows,
        validRows: validation.validRows,
        uploaded: false,
        results: validation.results,
      };
    }

    const savedResults = await this.dataSource.transaction(async manager => {
      const userRepository = manager.getRepository(User);
      const clientRepository = manager.getRepository(Client);
      const loanRepository = manager.getRepository(Loan);
      const results: ImportRowResult[] = [];

      await manager.query('LOCK TABLE loans IN EXCLUSIVE MODE');
      const lastLoan = await loanRepository
        .createQueryBuilder('loan')
        .select('loan.loanNumber', 'loanNumber')
        .orderBy('loan.createdAt', 'DESC')
        .limit(1)
        .getRawOne<{ loanNumber?: string }>();

      let nextLoanNumber = this.getNextLoanNumber(lastLoan?.loanNumber);

      for (const validRow of validation.validRowsData) {
        const hashedPassword = await this.hashService.hash(
          validRow.row.password,
        );

        const user = await userRepository.save(
          userRepository.create({
            email: validRow.row.email,
            password: hashedPassword,
            firstName: validRow.row.firstName,
            lastName: validRow.row.lastName,
            documentNumber: validRow.row.documentNumber,
            phoneNumber: validRow.row.phoneNumber || null,
            role: UserRole.CLIENTE,
            sourceType: SourceType.MASSIVE_IMPORT,
          }),
        );

        const client = await clientRepository.save(
          clientRepository.create({
            user,
            organization: { id: validRow.organization.id },
            address: validRow.row.address,
            birthDate: validRow.row.birthDate,
            employmentStatus: validRow.row.employmentStatus,
          }),
        );

        // Persistir fecha de nacimiento como DATE puro para evitar desfase por zona horaria.
        await manager.query(
          `UPDATE clients SET birth_date = $1::date WHERE id = $2`,
          [formatYmdUtc(validRow.row.birthDate), client.id],
        );

        let loanId: string | undefined;
        let loanNumber: string | undefined;

        if (validRow.row.hasLoanRequest) {
          if (
            !validRow.loanType ||
            validRow.row.amountRequested === undefined ||
            validRow.row.termMonths === undefined
          ) {
            throw new BadRequestException(
              `Fila ${validRow.rowNumber}: datos de solicitud incompletos para crear préstamo`,
            );
          }

          const calculation = this.calculateLoan(
            validRow.row.amountRequested,
            validRow.row.termMonths,
            Number(validRow.loanType.interestRate),
          );

          const currentLoanNumber = `LOAN-${nextLoanNumber.toString().padStart(6, '0')}`;
          nextLoanNumber += 1;

          const loan = await loanRepository.save(
            loanRepository.create({
              loanNumber: currentLoanNumber,
              client: { id: client.id },
              loanType: { id: validRow.loanType.id },
              organization: { id: validRow.organization.id },
              amountRequested: validRow.row.amountRequested,
              termMonths: validRow.row.termMonths,
              appliedInterestRate: Number(validRow.loanType.interestRate),
              monthlyPayment: calculation.monthlyPayment,
              totalInterest: calculation.totalInterest,
              totalPayable: calculation.totalPayable,
              status: LoanStatus.PENDIENTE,
            }),
          );

          loanId = loan.id;
          loanNumber = loan.loanNumber;
        }

        results.push({
          rowNumber: validRow.rowNumber,
          status: 'SUCCESS',
          email: validRow.email,
          documentNumber: validRow.documentNumber,
          clientId: client.id,
          loanId,
          loanNumber,
          errorMessage: validRow.row.hasLoanRequest
            ? undefined
            : 'Cliente creado sin solicitud (campos de préstamo opcionales vacíos).',
        });
      }

      return results.sort((a, b) => a.rowNumber - b.rowNumber);
    });

    return {
      fileName: command.file.originalname,
      totalRows: rows.length,
      processedRows: rows.length,
      successRows: savedResults.length,
      errorRows: 0,
      validRows: savedResults.length,
      uploaded: true,
      results: savedResults,
    };
  }

  private async validateRows(rows: ClientLoanImportRow[]) {
    const organizationRepo = this.dataSource.getRepository(Organization);
    const loanTypeRepo = this.dataSource.getRepository(LoanType);
    const userRepo = this.dataSource.getRepository(User);

    const organizationCache = new Map<
      string,
      Pick<Organization, 'id' | 'name'> | null
    >();
    const loanTypeCache = new Map<
      string,
      Pick<
        LoanType,
        | 'id'
        | 'name'
        | 'interestRate'
        | 'minAmount'
        | 'maxAmount'
        | 'minTerm'
        | 'maxTerm'
      > | null
    >();
    const resultsByRow = new Map<number, ImportRowResult>();
    const validRowsData: ValidatedImportRow[] = [];
    const seenEmails = new Set<string>();
    const seenDocumentNumbers = new Set<string>();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;
      const fallbackEmail = this.normalizeString(row.email).toLowerCase();
      const fallbackDocument = this.normalizeString(row.documentNumber);

      let parsedRow: ParsedRow;
      try {
        parsedRow = this.validateAndNormalizeRow(row, rowNumber);
      } catch (error) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: fallbackEmail,
          documentNumber: fallbackDocument,
          errorCode: this.getErrorCode(error),
          errorMessage: this.getErrorMessage(error),
        });
        continue;
      }

      if (seenEmails.has(parsedRow.email)) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'DUPLICATE_EMAIL_IN_FILE',
          errorMessage: 'El email está repetido en el archivo',
        });
        continue;
      }
      seenEmails.add(parsedRow.email);

      if (seenDocumentNumbers.has(parsedRow.documentNumber)) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'DUPLICATE_DOCUMENT_IN_FILE',
          errorMessage: 'El número de documento está repetido en el archivo',
        });
        continue;
      }
      seenDocumentNumbers.add(parsedRow.documentNumber);

      let organization = organizationCache.get(parsedRow.organizationName);
      if (organization === undefined) {
        const foundOrganization = await organizationRepo.findOne({
          where: { name: parsedRow.organizationName },
          select: ['id', 'name'],
        });
        organization = foundOrganization ?? null;
        organizationCache.set(parsedRow.organizationName, organization);
      }

      if (!organization) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'ORGANIZATION_NOT_FOUND',
          errorMessage: `La organización "${parsedRow.organizationName}" no existe`,
        });
        continue;
      }

      let loanType:
        | Pick<
            LoanType,
            | 'id'
            | 'name'
            | 'interestRate'
            | 'minAmount'
            | 'maxAmount'
            | 'minTerm'
            | 'maxTerm'
          >
        | null
        | undefined;

      if (parsedRow.hasLoanRequest && parsedRow.loanTypeName) {
        loanType = loanTypeCache.get(parsedRow.loanTypeName);
        if (loanType === undefined) {
          const foundLoanType = await loanTypeRepo.findOne({
            where: { name: parsedRow.loanTypeName },
            select: [
              'id',
              'name',
              'interestRate',
              'minAmount',
              'maxAmount',
              'minTerm',
              'maxTerm',
            ],
          });
          loanType = foundLoanType ?? null;
          loanTypeCache.set(parsedRow.loanTypeName, loanType);
        }

        if (!loanType) {
          resultsByRow.set(rowNumber, {
            rowNumber,
            status: 'ERROR',
            email: parsedRow.email,
            documentNumber: parsedRow.documentNumber,
            errorCode: 'LOAN_TYPE_NOT_FOUND',
            errorMessage: `El tipo de préstamo "${parsedRow.loanTypeName}" no existe`,
          });
          continue;
        }

        if (
          parsedRow.amountRequested === undefined ||
          parsedRow.termMonths === undefined
        ) {
          resultsByRow.set(rowNumber, {
            rowNumber,
            status: 'ERROR',
            email: parsedRow.email,
            documentNumber: parsedRow.documentNumber,
            errorCode: 'INCOMPLETE_LOAN_FIELDS',
            errorMessage:
              'Si vas a cargar solicitud, debes diligenciar tipoPrestamo, montoSolicitado y plazoMeses.',
          });
          continue;
        }

        if (
          parsedRow.amountRequested < Number(loanType.minAmount) ||
          parsedRow.amountRequested > Number(loanType.maxAmount)
        ) {
          resultsByRow.set(rowNumber, {
            rowNumber,
            status: 'ERROR',
            email: parsedRow.email,
            documentNumber: parsedRow.documentNumber,
            errorCode: 'AMOUNT_OUT_OF_RANGE',
            errorMessage: `Monto solicitado fuera de rango para "${parsedRow.loanTypeName}"`,
          });
          continue;
        }

        if (
          parsedRow.termMonths < loanType.minTerm ||
          parsedRow.termMonths > loanType.maxTerm
        ) {
          resultsByRow.set(rowNumber, {
            rowNumber,
            status: 'ERROR',
            email: parsedRow.email,
            documentNumber: parsedRow.documentNumber,
            errorCode: 'TERM_OUT_OF_RANGE',
            errorMessage: `Plazo fuera de rango para "${parsedRow.loanTypeName}"`,
          });
          continue;
        }
      }

      const emailExists = await userRepo.exists({
        where: { email: parsedRow.email },
      });

      if (emailExists) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'EMAIL_ALREADY_EXISTS',
          errorMessage: 'El email ya existe en el sistema',
        });
        continue;
      }

      const documentExists = await userRepo.exists({
        where: { documentNumber: parsedRow.documentNumber },
      });

      if (documentExists) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'DOCUMENT_ALREADY_EXISTS',
          errorMessage: 'El número de documento ya existe en el sistema',
        });
        continue;
      }

      validRowsData.push({
        rowNumber,
        email: parsedRow.email,
        documentNumber: parsedRow.documentNumber,
        row: parsedRow,
        organization,
        loanType: loanType ?? undefined,
      });
    }

    const hasErrors = Array.from(resultsByRow.values()).some(
      result => result.status === 'ERROR',
    );

    const results: ImportRowResult[] = rows
      .map<ImportRowResult>((row, index) => {
        const rowNumber = index + 2;
        const existing = resultsByRow.get(rowNumber);
        if (existing) {
          return existing;
        }

        const validRow = validRowsData.find(
          item => item.rowNumber === rowNumber,
        );
        const email =
          validRow?.email ?? this.normalizeString(row.email).toLowerCase();
        const documentNumber =
          validRow?.documentNumber ?? this.normalizeString(row.documentNumber);

        if (hasErrors) {
          return {
            rowNumber,
            status: 'VALID',
            email,
            documentNumber,
            errorCode: 'ROW_VALID',
            errorMessage:
              'Fila válida, pero no se cargó porque existen filas con error (modo todo o nada).',
          };
        }

        return {
          rowNumber,
          status: 'VALID',
          email,
          documentNumber,
        };
      })
      .sort((a, b) => a.rowNumber - b.rowNumber);

    const invalidRows = results.filter(item => item.status === 'ERROR').length;
    const validRows = results.filter(item => item.status !== 'ERROR').length;

    return {
      hasErrors,
      results,
      validRowsData,
      validRows,
      invalidRows,
    };
  }

  private getNextLoanNumber(lastLoanNumber?: string): number {
    if (!lastLoanNumber) {
      return 1;
    }

    const [, numericPart] = lastLoanNumber.split('-');
    const lastNumber = Number(numericPart || 0);
    return Number.isFinite(lastNumber) && lastNumber > 0 ? lastNumber + 1 : 1;
  }

  private calculateLoan(
    amountRequested: number,
    termMonths: number,
    annualInterestRate: number,
  ) {
    const monthlyRate =
      annualInterestRate === 0
        ? 0
        : Math.round(
            (Math.pow(1 + annualInterestRate / 100, 1 / 12) - 1) * 1000000,
          ) / 1000000;

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

  private validateAndNormalizeRow(
    row: ClientLoanImportRow,
    rowNumber: number,
  ): ParsedRow {
    const email = this.normalizeString(row.email).toLowerCase();
    const password = this.normalizeString(row.password);
    const firstName = this.normalizeString(row.firstName);
    const lastName = this.normalizeString(row.lastName);
    const documentNumber = this.normalizeString(row.documentNumber);
    const phoneNumber = this.normalizeString(row.phoneNumber);
    const address = this.normalizeString(row.address);
    const employmentStatusRaw = this.normalizeString(
      row.employmentStatus,
    ).toUpperCase();
    const organizationName = this.normalizeString(row.organizationName);
    const loanTypeName = this.normalizeString(row.loanTypeName);
    const amountRequestedRaw = this.normalizeString(row.amountRequested);
    const termMonthsRaw = this.normalizeString(row.termMonths);
    const birthDate = this.parseBirthDate(row.birthDate);

    if (!email)
      throw new BadRequestException(`Fila ${rowNumber}: email es requerido`);
    if (!password)
      throw new BadRequestException(`Fila ${rowNumber}: password es requerido`);
    if (!firstName)
      throw new BadRequestException(
        `Fila ${rowNumber}: firstName es requerido`,
      );
    if (!lastName)
      throw new BadRequestException(`Fila ${rowNumber}: lastName es requerido`);
    if (!documentNumber) {
      throw new BadRequestException(
        `Fila ${rowNumber}: documentNumber es requerido`,
      );
    }
    if (!address)
      throw new BadRequestException(`Fila ${rowNumber}: address es requerido`);
    if (!organizationName) {
      throw new BadRequestException(
        `Fila ${rowNumber}: organizationName es requerido`,
      );
    }
    const hasLoanTypeName = !!loanTypeName;
    const hasAmountRequested = !!amountRequestedRaw;
    const hasTermMonths = !!termMonthsRaw;
    const providedLoanFields = [
      hasLoanTypeName,
      hasAmountRequested,
      hasTermMonths,
    ].filter(Boolean).length;

    if (providedLoanFields > 0 && providedLoanFields < 3) {
      throw new BadRequestException(
        `Fila ${rowNumber}: si deseas crear solicitud, debes diligenciar tipoPrestamo, montoSolicitado y plazoMeses`,
      );
    }

    const hasLoanRequest = providedLoanFields === 3;
    let amountRequested: number | undefined;
    let termMonths: number | undefined;

    if (hasLoanRequest) {
      amountRequested = this.toNumber(row.amountRequested);
      termMonths = this.toNumber(row.termMonths);

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
    }
    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException(
        `Fila ${rowNumber}: birthDate debe tener formato DD-MM-YYYY`,
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
      loanTypeName: hasLoanRequest ? loanTypeName : undefined,
      amountRequested,
      termMonths,
      hasLoanRequest,
    };
  }

  private parseBirthDate(value: string | number | Date): Date | null {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        return null;
      }

      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      const parsedDate = parseYmdToUtcDate(`${year}-${month}-${day}`);
      if (Number.isNaN(parsedDate.getTime())) {
        return null;
      }

      return parsedDate;
    }

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

    const dmyMatch = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!dmyMatch) {
      return null;
    }

    const [, day, month, year] = dmyMatch;
    const parsedDate = parseYmdToUtcDate(`${year}-${month}-${day}`);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  private toNumber(value: string | number | Date): number {
    if (value instanceof Date) {
      return Number.NaN;
    }

    if (typeof value === 'number') {
      return value;
    }

    const normalized = this.normalizeString(value).replace(/,/g, '');
    return Number(normalized);
  }

  private normalizeString(value: string | number | Date): string {
    if (value instanceof Date) {
      return `${value.getDate().toString().padStart(2, '0')}-${(
        value.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}-${value.getFullYear()}`;
    }

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
    if (
      error?.response?.message &&
      typeof error.response.message === 'string'
    ) {
      return error.response.message;
    }
    if (error?.code) {
      return String(error.code);
    }
    return 'IMPORT_ROW_ERROR';
  }
}
