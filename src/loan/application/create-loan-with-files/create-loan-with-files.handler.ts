import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanWithFilesCommand } from './create-loan-with-files.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';
import { OrganizationRepository } from 'src/organization/infrastructure/repositories/organization.repository';
import { LoanTypeRepository } from 'src/loan-type/infrastructure/repositories/loan-type.repository';
import { LoanDocumentRepository } from 'src/loan-document/infrastructure/repositories/loan-document.repository';
import { DocumentTypeRepository } from 'src/document-type/infrastructure/repositories/document-type.repository';
import { StorageService } from 'src/storage/infrastructure/storage.service';
import { LoanCalculatorService } from '../../domain/loan-calculator.service';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';

@CommandHandler(CreateLoanWithFilesCommand)
export class CreateLoanWithFilesHandler
  implements ICommandHandler<CreateLoanWithFilesCommand>
{
  private readonly logger = new Logger(CreateLoanWithFilesHandler.name);

  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly clientRepository: ClientRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly loanTypeRepository: LoanTypeRepository,
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly documentTypeRepository: DocumentTypeRepository,
    private readonly storageService: StorageService,
    private readonly loanCalculatorService: LoanCalculatorService,
  ) {}

  async execute(command: CreateLoanWithFilesCommand): Promise<any> {
    const {
      clientId,
      loanTypeName,
      organizationName,
      files,
      documentTypeCodes,
    } = command;

    // Validaciones - ahora busca por nombre
    const client = await this.validateClient(clientId);
    const organization = await this.validateOrganization(organizationName);
    const loanType = await this.validateLoanType(
      loanTypeName,
      command.amountRequested,
      command.termMonths,
    );

    // Calcular préstamo
    const appliedInterestRate = Number(loanType.interestRate);
    const validatedCalculation =
      this.loanCalculatorService.validateAndCalculate({
        amountRequested: command.amountRequested,
        termMonths: command.termMonths,
        annualInterestRate: appliedInterestRate,
        frontendMonthlyPayment: command.monthlyPayment,
        frontendTotalInterest: command.totalInterest,
        frontendTotalPayable: command.totalPayable,
      });

    // Crear préstamo usando los IDs resueltos
    const loanNumber = await this.loanRepository.generateLoanNumber();
    const newLoan = await this.loanRepository.createLoan({
      loanNumber,
      client: { id: client.id },
      loanType: { id: loanType.id },
      organization: { id: organization.id },
      amountRequested: command.amountRequested,
      termMonths: command.termMonths,
      appliedInterestRate,
      monthlyPayment: validatedCalculation.monthlyPayment,
      totalInterest: validatedCalculation.totalInterest,
      totalPayable: validatedCalculation.totalPayable,
      status: LoanStatus.PENDIENTE,
    });

    // Procesar documentos si existen
    if (files?.length > 0 && documentTypeCodes?.length > 0) {
      await this.processDocuments(newLoan.id, files, documentTypeCodes);
    }

    return { loanId: newLoan.id, loanNumber: newLoan.loanNumber };
  }

  private async validateClient(clientId: string) {
    const client = await this.clientRepository.findOne(clientId);
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${clientId} no encontrado`);
    }
    return client;
  }

  private async validateOrganization(organizationName: string) {
    const organization =
      await this.organizationRepository.findByName(organizationName);
    if (!organization) {
      throw new NotFoundException(
        `Organización "${organizationName}" no encontrada`,
      );
    }
    return organization;
  }

  private async validateLoanType(
    loanTypeName: string,
    amount: number,
    term: number,
  ) {
    const loanType = await this.loanTypeRepository.findByName(loanTypeName);
    if (!loanType) {
      throw new NotFoundException(
        `Tipo de préstamo "${loanTypeName}" no encontrado`,
      );
    }

    if (amount < loanType.minAmount || amount > loanType.maxAmount) {
      throw new BadRequestException(
        `Monto fuera de límites (${loanType.minAmount}-${loanType.maxAmount})`,
      );
    }

    if (term < loanType.minTerm || term > loanType.maxTerm) {
      throw new BadRequestException(
        `Plazo fuera de límites (${loanType.minTerm}-${loanType.maxTerm} meses)`,
      );
    }

    return loanType;
  }

  private async processDocuments(
    loanId: string,
    files: Express.Multer.File[],
    documentTypeCodes: string[],
  ): Promise<void> {
    const documentTypes =
      await this.documentTypeRepository.findByCodes(documentTypeCodes);
    const codeToIdMap = new Map(documentTypes.map(dt => [dt.code, dt.id]));

    // Validar códigos
    const invalidCodes = documentTypeCodes.filter(
      code => !codeToIdMap.has(code),
    );
    if (invalidCodes.length > 0) {
      throw new BadRequestException(
        `Tipos de documento no encontrados: ${invalidCodes.join(', ')}`,
      );
    }

    // Subir archivos y crear registros
    const uploadedDocuments = await Promise.all(
      files.map(async (file, index) => {
        const documentTypeId = codeToIdMap.get(documentTypeCodes[index]);
        const uploadResult = await this.storageService.uploadFile(
          file,
          `loans/${loanId}`,
        );
        this.logger.log(
          `Archivo subido: ${file.originalname} -> ${uploadResult.url}`,
        );
        return { documentTypeId, url: uploadResult.url };
      }),
    );

    await this.loanDocumentRepository.createBatch(loanId, uploadedDocuments);
  }
}
