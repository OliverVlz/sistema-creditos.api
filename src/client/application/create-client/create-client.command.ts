import { EmploymentStatus, UserRole } from 'src/shared/enums';

export class CreateClientCommand {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly address: string;
  readonly birthDate: string;
  readonly documentNumber: string;
  readonly phoneNumber?: string;
  readonly employmentStatus: EmploymentStatus;
  readonly organizationId: string;
  readonly role: UserRole;
  readonly createdBy?: string;

  constructor(params: CreateClientCommand) {
    Object.assign(this, params);
  }
}
