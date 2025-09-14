import { IsUUID, IsString, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class UpdateOrganizationCommand {
  @IsUUID()
  readonly id: string;

  @IsOptional()
  @IsString()
  readonly name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly baseInterestRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly discountRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly taxRate?: number;

  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @IsUUID()
  @IsOptional()
  readonly updatedBy?: string;

  constructor(id: string, params: Partial<UpdateOrganizationCommand>) {
    this.id = id;
    Object.assign(this, params);
  }
}
