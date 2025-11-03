import { EmploymentStatus, UserRole } from "src/shared/enums";

export class CreateUserClientCommand {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly address: string;
  readonly birthDate: string;
  readonly documentNumber: string;
  readonly phone?: string;
  readonly employmentStatus: EmploymentStatus;
  readonly organizationId: string;
  readonly role: UserRole;
  readonly createdBy?: string;

  constructor(params: CreateUserClientCommand) {
    Object.assign(this, params);
  }
}
