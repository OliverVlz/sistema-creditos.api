import { EmploymentStatus } from 'src/shared/enums';

export class UpdateClientProfileCommand {
  readonly userId: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly address?: string;
  readonly phoneNumber?: string;
  readonly birthDate?: string;
  readonly employmentStatus?: EmploymentStatus;
  readonly organizationId?: string;

  constructor(params: UpdateClientProfileCommand) {
    Object.assign(this, params);
  }
}
