export class GetLoanByIdQuery {
  constructor(
    readonly id: string,
    readonly requestingUserId: string,
    readonly requestingUserRole: string,
  ) {}
}
