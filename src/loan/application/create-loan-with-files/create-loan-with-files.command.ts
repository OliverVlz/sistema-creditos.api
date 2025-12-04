export class CreateLoanWithFilesCommand {
  public readonly clientId: string;
  public readonly loanTypeName: string;
  public readonly organizationName: string;
  public readonly amountRequested: number;
  public readonly termMonths: number;
  public readonly monthlyPayment: number;
  public readonly totalInterest: number;
  public readonly totalPayable: number;
  public readonly documentTypeCodes?: string[];
  public readonly files: Express.Multer.File[];

  constructor(data: {
    clientId: string;
    loanTypeName: string;
    organizationName: string;
    amountRequested: number;
    termMonths: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayable: number;
    documentTypeCodes?: string[];
    files: Express.Multer.File[];
  }) {
    this.clientId = data.clientId;
    this.loanTypeName = data.loanTypeName;
    this.organizationName = data.organizationName;
    this.amountRequested = data.amountRequested;
    this.termMonths = data.termMonths;
    this.monthlyPayment = data.monthlyPayment;
    this.totalInterest = data.totalInterest;
    this.totalPayable = data.totalPayable;
    this.documentTypeCodes = data.documentTypeCodes;
    this.files = data.files;
  }
}
