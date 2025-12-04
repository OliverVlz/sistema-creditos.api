export class CreateLoanWithFilesCommand {
  public readonly clientId: string;
  public readonly loanTypeId: string;
  public readonly organizationId: string;
  public readonly amountRequested: number;
  public readonly termMonths: number;
  public readonly monthlyPayment: number;
  public readonly totalInterest: number;
  public readonly totalPayable: number;
  public readonly documentTypeCodes?: string[];
  public readonly files: Express.Multer.File[];

  constructor(data: {
    clientId: string;
    loanTypeId: string;
    organizationId: string;
    amountRequested: number;
    termMonths: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayable: number;
    documentTypeCodes?: string[];
    files: Express.Multer.File[];
  }) {
    this.clientId = data.clientId;
    this.loanTypeId = data.loanTypeId;
    this.organizationId = data.organizationId;
    this.amountRequested = data.amountRequested;
    this.termMonths = data.termMonths;
    this.monthlyPayment = data.monthlyPayment;
    this.totalInterest = data.totalInterest;
    this.totalPayable = data.totalPayable;
    this.documentTypeCodes = data.documentTypeCodes;
    this.files = data.files;
  }
}
