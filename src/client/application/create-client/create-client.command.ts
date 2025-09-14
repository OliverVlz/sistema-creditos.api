import { EmploymentStatus } from "src/shared/enums";

export class CreateClientCommand {
  readonly userId: string;
  readonly organizationId: string;
  readonly createdBy: string; 
  readonly employmentStatus: EmploymentStatus;

  constructor(params: CreateClientCommand) {
    Object.assign(this, params);
  }
}
