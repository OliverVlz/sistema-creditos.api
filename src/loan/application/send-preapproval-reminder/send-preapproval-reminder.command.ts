export class SendPreapprovalReminderCommand {
  constructor(
    readonly loanId: string,
    readonly requestedBy: string,
  ) {}
}
