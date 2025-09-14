import { IsNotEmpty, IsString, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class CreateOrganizationCommand {
  readonly name: string;
  readonly baseInterestRate: number;
  readonly discountRate: number;
  readonly taxRate: number;
  readonly createdBy: string; // Add createdBy

  constructor(params: {
    name: string;
    baseInterestRate: number;
    discountRate: number;
    taxRate: number;
    createdBy: string;
  }) {
    Object.assign(this, params);
  }
}
