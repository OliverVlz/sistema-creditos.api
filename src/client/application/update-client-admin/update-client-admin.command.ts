import { EmploymentStatus } from 'src/shared/enums';

export class UpdateClientAdminCommand {
  readonly userId: string;
  readonly updatedBy: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly address?: string;
  readonly phoneNumber?: string;
  readonly birthDate?: string;
  readonly employmentStatus?: EmploymentStatus;
  readonly organizationId?: string;
  readonly isActive?: boolean;
  readonly email?: string;

  constructor(params: UpdateClientAdminCommand) {
    Object.assign(this, params);
  }
}
