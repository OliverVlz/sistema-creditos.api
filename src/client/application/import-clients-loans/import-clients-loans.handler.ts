import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager, Repository } from 'typeorm';
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
  birthDate?: Date;
  address?: string;
  employmentStatus?: EmploymentStatus;
  organizationName?: string;
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
  organization?: Pick<Organization, 'id' | 'name'>;
  existingUser?: Pick<
    User,
    | 'id'
    | 'email'
    | 'documentNumber'
    | 'firstName'
    | 'lastName'
    | 'phoneNumber'
    | 'role'
  >;
  existingClient?: Pick<Client, 'id'> & {
    organization?: Pick<Organization, 'id' | 'name'>;
  };
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

type UserIdentityContext = Pick<
  User,
  | 'id'
  | 'email'
  | 'documentNumber'
  | 'firstName'
  | 'lastName'
  | 'phoneNumber'
  | 'role'
> & {
  client?: Pick<Client, 'id'> & {
    organization?: Pick<Organization, 'id' | 'name'>;
  };
};

type RowValidationResult = {
  row?: ParsedRow;
  errors: string[];
};

@Injectable()
@CommandHandler(ImportClientsLoansCommand)
export class ImportClientsLoansHandler
  implements ICommandHandler<ImportClientsLoansCommand>
{
  private readonly supportedLoanTypeName = 'Libranza';
  private readonly supportedOrganizationNames = [
    'Policía Nacional',
    'Ejército Nacional',
    'Armada Nacional',
    'Fuerza Aeroespacial',
  ] as const;
  private readonly supportedOrganizationNamesList: readonly string[] =
    this.supportedOrganizationNames;

  constructor(
    private readonly dataSource: DataSource,
    private readonly hashService: HashService,
  ) {}

  async execute(command: ImportClientsLoansCommand) {
    if (!command.file) {
      throw new BadRequestException('Debe adjuntar un archivo .xlsx o .csv');
    }

    const extension = command.file.originalname.split('.').pop()?.toLowerCase();
    if (!extension || !['xlsx', 'csv'].includes(extension)) {
      throw new BadRequestException(
        'Formato inválido. Solo se admiten archivos .xlsx o .csv',
      );
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
      const persistedClientsByDocument = new Map<
        string,
        {
          clientId: string;
          organizationId?: string;
        }
      >();

      await manager.query('LOCK TABLE loans IN EXCLUSIVE MODE');
      let nextLoanNumber = await this.getNextLoanSequenceNumber(manager);

      for (const validRow of validation.validRowsData) {
        let persistedClient = persistedClientsByDocument.get(
          validRow.documentNumber,
        );
        let clientId: string;

        if (!persistedClient) {
          let user = validRow.existingUser
            ? await userRepository.findOne({
                where: { id: validRow.existingUser.id },
              })
            : null;

          if (!user) {
            const hashedPassword = await this.hashService.hash(
              validRow.row.password,
            );
            user = await userRepository.save(
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
          }

          let client = await clientRepository.findOne({
            where: { user: { id: user.id } },
            relations: ['organization'],
          });

          if (!client) {
            client = await clientRepository.save(
              clientRepository.create({
                user,
                organization: validRow.organization
                  ? { id: validRow.organization.id }
                  : null,
                address: validRow.row.address ?? null,
                birthDate: validRow.row.birthDate ?? null,
                employmentStatus: validRow.row.employmentStatus ?? null,
              }),
            );

            if (validRow.row.birthDate) {
              await manager.query(
                `UPDATE clients SET birth_date = $1::date WHERE id = $2`,
                [formatYmdUtc(validRow.row.birthDate), client.id],
              );
            }
          }

          clientId = client.id;
          persistedClient = {
            clientId: client.id,
            organizationId:
              validRow.organization?.id ??
              client.organization?.id,
          };
          persistedClientsByDocument.set(validRow.documentNumber, persistedClient);
        } else {
          clientId = persistedClient.clientId;
        }

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
          const loanOrganizationId =
            validRow.organization?.id || persistedClient.organizationId;

          const currentLoanNumber = `LOAN-${nextLoanNumber.toString().padStart(6, '0')}`;
          nextLoanNumber += 1;

          const loan = await this.createLoanWithUniqueNumber({
            loanRepository,
            clientId: persistedClient.clientId,
            loanTypeId: validRow.loanType.id,
            organizationId: loanOrganizationId,
            amountRequested: validRow.row.amountRequested,
            termMonths: validRow.row.termMonths,
            appliedInterestRate: Number(validRow.loanType.interestRate),
            monthlyPayment: calculation.monthlyPayment,
            totalInterest: calculation.totalInterest,
            totalPayable: calculation.totalPayable,
            nextLoanNumberRef: {
              get value() {
                return nextLoanNumber;
              },
              set value(v: number) {
                nextLoanNumber = v;
              },
            },
          });

          loanId = loan.id;
          loanNumber = loan.loanNumber;
        }

        results.push({
          rowNumber: validRow.rowNumber,
          status: 'SUCCESS',
          email: validRow.email,
          documentNumber: validRow.documentNumber,
          clientId,
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
    const seenEmailByDocument = new Map<string, string>();
    const seenDocumentByEmail = new Map<string, string>();
    const identityByEmail = new Map<string, UserIdentityContext | null>();
    const identityByDocument = new Map<string, UserIdentityContext | null>();

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const rowNumber = index + 2;
      const fallbackEmail = this.normalizeString(row.email).toLowerCase();
      const fallbackDocument = this.normalizeString(row.documentNumber);

      let parsedRow: ParsedRow;
      const rowValidation = this.validateAndNormalizeRow(row, rowNumber);
      if (!rowValidation.row) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: fallbackEmail,
          documentNumber: fallbackDocument,
          errorCode: 'ROW_VALIDATION_ERRORS',
          errorMessage: rowValidation.errors.join(' | '),
        });
        continue;
      }
      parsedRow = rowValidation.row;

      const seenEmail = seenEmailByDocument.get(parsedRow.documentNumber);
      if (seenEmail && seenEmail !== parsedRow.email) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'DOCUMENT_WITH_MULTIPLE_EMAILS',
          errorMessage:
            'El mismo documento aparece con correos distintos en el archivo',
        });
        continue;
      }
      seenEmailByDocument.set(parsedRow.documentNumber, parsedRow.email);

      const seenDocument = seenDocumentByEmail.get(parsedRow.email);
      if (seenDocument && seenDocument !== parsedRow.documentNumber) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'EMAIL_WITH_MULTIPLE_DOCUMENTS',
          errorMessage:
            'El mismo correo aparece con documentos distintos en el archivo',
        });
        continue;
      }
      seenDocumentByEmail.set(parsedRow.email, parsedRow.documentNumber);

      let existingIdentity: UserIdentityContext | null;
      try {
        existingIdentity = await this.resolveIdentity({
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          userRepo,
          identityByEmail,
          identityByDocument,
        });
      } catch (error) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: this.getErrorCode(error),
          errorMessage: this.getErrorMessage(error),
        });
        continue;
      }

      if (existingIdentity && existingIdentity.role !== UserRole.CLIENTE) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'USER_NOT_CLIENT',
          errorMessage:
            'El correo/documento ya existe en un usuario que no es cliente',
        });
        continue;
      }

      if (!existingIdentity && !parsedRow.password) {
        resultsByRow.set(rowNumber, {
          rowNumber,
          status: 'ERROR',
          email: parsedRow.email,
          documentNumber: parsedRow.documentNumber,
          errorCode: 'PASSWORD_REQUIRED',
          errorMessage:
            'password es requerido para crear un cliente nuevo en importación',
        });
        continue;
      }

      let organization:
        | Pick<Organization, 'id' | 'name'>
        | null
        | undefined;
      if (parsedRow.organizationName) {
        if (
          !this.supportedOrganizationNamesList.includes(
            parsedRow.organizationName,
          )
        ) {
          resultsByRow.set(rowNumber, {
            rowNumber,
            status: 'ERROR',
            email: parsedRow.email,
            documentNumber: parsedRow.documentNumber,
            errorCode: 'INVALID_ORGANIZATION_NAME',
            errorMessage: `La organización debe coincidir exactamente con el catálogo permitido: ${this.supportedOrganizationNames.join(', ')}`,
          });
          continue;
        }

        organization = organizationCache.get(parsedRow.organizationName);
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
        if (parsedRow.loanTypeName !== this.supportedLoanTypeName) {
          resultsByRow.set(rowNumber, {
            rowNumber,
            status: 'ERROR',
            email: parsedRow.email,
            documentNumber: parsedRow.documentNumber,
            errorCode: 'INVALID_LOAN_TYPE',
            errorMessage:
              'Solo se permite tipoPrestamo "Libranza" o dejar los campos de préstamo vacíos',
          });
          continue;
        }

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

      validRowsData.push({
        rowNumber,
        email: parsedRow.email,
        documentNumber: parsedRow.documentNumber,
        row: parsedRow,
        organization: organization ?? undefined,
        existingUser: existingIdentity
          ? {
              id: existingIdentity.id,
              email: existingIdentity.email,
              documentNumber: existingIdentity.documentNumber,
              firstName: existingIdentity.firstName,
              lastName: existingIdentity.lastName,
              phoneNumber: existingIdentity.phoneNumber,
              role: existingIdentity.role,
            }
          : undefined,
        existingClient: existingIdentity?.client
          ? {
              id: existingIdentity.client.id,
              organization: existingIdentity.client.organization,
            }
          : undefined,
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
              'Fila correcta, pero no se cargó porque el archivo contiene errores en otras filas (carga todo o nada).',
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

  private async getNextLoanSequenceNumber(
    manager: EntityManager,
  ): Promise<number> {
    const [row] = (await manager.query(
      `SELECT COALESCE(MAX(CAST(SPLIT_PART(loan_number, '-', 2) AS INTEGER)), 0) AS max_number FROM loans`,
    )) as Array<{ max_number: string | number }>;

    const maxNumber = Number(row?.max_number ?? 0);
    return Number.isFinite(maxNumber) && maxNumber >= 0 ? maxNumber + 1 : 1;
  }

  private async createLoanWithUniqueNumber(params: {
    loanRepository: Repository<Loan>;
    clientId: string;
    loanTypeId: string;
    organizationId?: string;
    amountRequested: number;
    termMonths: number;
    appliedInterestRate: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayable: number;
    nextLoanNumberRef: { value: number };
  }) {
    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const currentLoanNumber = `LOAN-${params.nextLoanNumberRef.value
        .toString()
        .padStart(6, '0')}`;
      params.nextLoanNumberRef.value += 1;
      attempts += 1;

      try {
        return await params.loanRepository.save(
          params.loanRepository.create({
            loanNumber: currentLoanNumber,
            client: { id: params.clientId },
            loanType: { id: params.loanTypeId },
            organization: params.organizationId
              ? { id: params.organizationId }
              : null,
            amountRequested: params.amountRequested,
            termMonths: params.termMonths,
            appliedInterestRate: params.appliedInterestRate,
            monthlyPayment: params.monthlyPayment,
            totalInterest: params.totalInterest,
            totalPayable: params.totalPayable,
            status: LoanStatus.PENDIENTE,
          }),
        );
      } catch (error: any) {
        const isDuplicateLoanNumber =
          error?.code === '23505' &&
          (error?.constraint === 'UQ_2c3924c4f76a8318dabc7f23d8b' ||
            String(error?.detail || '').includes('(loan_number)='));

        if (!isDuplicateLoanNumber || attempts >= maxAttempts) {
          throw error;
        }
      }
    }

    throw new BadRequestException(
      'No se pudo generar un número de solicitud único',
    );
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
  ): RowValidationResult {
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
    const loanTypeName = this.normalizeLoanTypeName(row.loanTypeName);
    const amountRequestedRaw = this.normalizeString(row.amountRequested);
    const termMonthsRaw = this.normalizeString(row.termMonths);
    const hasBirthDate = this.hasValue(row.birthDate);
    const birthDate = hasBirthDate ? this.parseBirthDate(row.birthDate) : null;
    const errors: string[] = [];

    if (!email) errors.push(`Fila ${rowNumber}: email es requerido`);
    if (!password) errors.push(`Fila ${rowNumber}: la contraseña es requerida`);
    if (!firstName) errors.push(`Fila ${rowNumber}: el nombre es requerido`);
    if (!lastName) errors.push(`Fila ${rowNumber}: el apellido es requerido`);
    if (!documentNumber)
      errors.push(`Fila ${rowNumber}: el número de documento es requerido`);
    const hasLoanTypeName = !!loanTypeName;
    const hasAmountRequested = !!amountRequestedRaw;
    const hasTermMonths = !!termMonthsRaw;
    const providedLoanFields = [
      hasLoanTypeName,
      hasAmountRequested,
      hasTermMonths,
    ].filter(Boolean).length;

    if (providedLoanFields > 0 && providedLoanFields < 3) {
      errors.push(
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
        errors.push(
          `Fila ${rowNumber}: el monto solicitado debe ser un número mayor a 0`,
        );
      }
      if (!Number.isInteger(termMonths) || termMonths <= 0) {
        errors.push(
          `Fila ${rowNumber}: el plazo en meses debe ser un número entero mayor a 0`,
        );
      }
    }
    if (hasBirthDate && (!birthDate || Number.isNaN(birthDate.getTime()))) {
      errors.push(
        `Fila ${rowNumber}: la fecha de nacimiento debe tener formato DD-MM-YYYY o DD/MM/YYYY`,
      );
    }
    if (!this.isValidEmail(email)) {
      errors.push(`Fila ${rowNumber}: el correo no es válido`);
    }
    if (password.length < 8) {
      errors.push(
        `Fila ${rowNumber}: la contraseña debe tener mínimo 8 caracteres`,
      );
    }

    let employmentStatus: EmploymentStatus | undefined;
    if (employmentStatusRaw) {
      employmentStatus = employmentStatusRaw as EmploymentStatus;
    }
    if (
      employmentStatus !== undefined &&
      !Object.values(EmploymentStatus).includes(employmentStatus)
    ) {
      errors.push(
        `Fila ${rowNumber}: el estado laboral debe ser ACTIVO o JUBILADO`,
      );
    }

    if (errors.length > 0) {
      return { errors };
    }

    return {
      row: {
        email,
        password,
        firstName,
        lastName,
        documentNumber,
        phoneNumber,
        birthDate,
        address: address || undefined,
        employmentStatus,
        organizationName: organizationName || undefined,
        loanTypeName: hasLoanRequest ? loanTypeName : undefined,
        amountRequested,
        termMonths,
        hasLoanRequest,
      },
      errors: [],
    };
  }

  private async resolveIdentity(params: {
    email: string;
    documentNumber: string;
    userRepo: Repository<User>;
    identityByEmail: Map<string, UserIdentityContext | null>;
    identityByDocument: Map<string, UserIdentityContext | null>;
  }): Promise<UserIdentityContext | null> {
    const {
      email,
      documentNumber,
      userRepo,
      identityByEmail,
      identityByDocument,
    } = params;

    let identityByEmailValue = identityByEmail.get(email);
    if (identityByEmailValue === undefined) {
      const foundByEmail = await userRepo.findOne({
        where: { email },
        relations: ['client', 'client.organization'],
      });
      identityByEmailValue = foundByEmail ?? null;
      identityByEmail.set(email, identityByEmailValue);
      if (foundByEmail) {
        identityByDocument.set(foundByEmail.documentNumber, foundByEmail);
      }
    }

    let identityByDocumentValue = identityByDocument.get(documentNumber);
    if (identityByDocumentValue === undefined) {
      const foundByDocument = await userRepo.findOne({
        where: { documentNumber },
        relations: ['client', 'client.organization'],
      });
      identityByDocumentValue = foundByDocument ?? null;
      identityByDocument.set(documentNumber, identityByDocumentValue);
      if (foundByDocument) {
        identityByEmail.set(foundByDocument.email, foundByDocument);
      }
    }

    if (identityByEmailValue && identityByDocumentValue) {
      if (identityByEmailValue.id !== identityByDocumentValue.id) {
        throw new BadRequestException(
          'El correo y el documento pertenecen a usuarios diferentes',
        );
      }
      return identityByEmailValue;
    }

    return identityByEmailValue ?? identityByDocumentValue ?? null;
  }

  private hasValue(value: string | number | Date): boolean {
    if (value instanceof Date) {
      return !Number.isNaN(value.getTime());
    }
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }
    return this.normalizeString(value).length > 0;
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

    const dmyMatch = normalized.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
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

    return this.normalizeMojibake(String(value ?? '').trim());
  }

  private normalizeLoanTypeName(value: string | number | Date): string {
    const normalized = this.normalizeString(value);
    if (!normalized) {
      return normalized;
    }
    if (normalized.toLowerCase() === this.supportedLoanTypeName.toLowerCase()) {
      return this.supportedLoanTypeName;
    }
    return normalized;
  }

  private normalizeMojibake(value: string): string {
    if (!value) {
      return value;
    }

    if (!/[ÃÂ]/.test(value)) {
      return value;
    }

    try {
      const repaired = Buffer.from(value, 'latin1').toString('utf8').trim();
      return repaired || value;
    } catch {
      return value;
    }
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
