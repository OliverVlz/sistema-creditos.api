import { IsNotEmpty, IsString, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class CreateOrganizationCommand {
  readonly name: string;
  readonly baseInterestRate: number;
  readonly discountRate: number;
  readonly taxRate: number;

  constructor(params: {
    name: string;
    baseInterestRate: number;
    discountRate: number;
    taxRate: number;
  }) {
    Object.assign(this, params);
  }
}
