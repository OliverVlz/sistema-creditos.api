import { LoanStatus } from '../../infrastructure/entity/loan.entity';

export class UpdateLoanWithFilesCommand {
  public readonly loanId: string;
  public readonly status?: LoanStatus;
  public readonly rejectionReason?: string;
  public readonly managerId?: string;
  public readonly updatedBy: string;

  // Archivos nuevos a agregar
  public readonly newDocumentTypeCodes?: string[];
  public readonly newFiles: Express.Multer.File[];

  // Archivos para reemplazar documentos existentes
  public readonly replaceDocumentIds?: string[];
  public readonly replaceFiles: Express.Multer.File[];

  constructor(data: {
    loanId: string;
    status?: LoanStatus;
    rejectionReason?: string;
    managerId?: string;
    updatedBy: string;
    newDocumentTypeCodes?: string[];
    newFiles?: Express.Multer.File[];
    replaceDocumentIds?: string[];
    replaceFiles?: Express.Multer.File[];
  }) {
    this.loanId = data.loanId;
    this.status = data.status;
    this.rejectionReason = data.rejectionReason;
    this.managerId = data.managerId;
    this.updatedBy = data.updatedBy;
    this.newDocumentTypeCodes = data.newDocumentTypeCodes;
    this.newFiles = data.newFiles || [];
    this.replaceDocumentIds = data.replaceDocumentIds;
    this.replaceFiles = data.replaceFiles || [];
  }
}
