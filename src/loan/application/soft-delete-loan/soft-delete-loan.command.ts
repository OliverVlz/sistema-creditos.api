export class SoftDeleteLoanCommand {
  constructor(
    readonly id: string,
    readonly deletedBy: string,
  ) {}
}
