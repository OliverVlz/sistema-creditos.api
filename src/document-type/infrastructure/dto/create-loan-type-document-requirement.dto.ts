import { IsNotEmpty, IsUUID, IsBoolean, IsOptional, IsEnum, IsNumber, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmploymentStatus } from 'src/shared/enums';

export class CreateLoanTypeDocumentRequirementDto {
  @ApiProperty({ description: 'ID del tipo de préstamo' })
  @IsNotEmpty()
  @IsUUID()
  loanTypeId: string;

  @ApiProperty({ description: 'ID del tipo de documento' })
  @IsNotEmpty()
  @IsUUID()
  documentTypeId: string;

  @ApiProperty({ 
    description: 'ID de la organización (opcional, aplica para todas si no se especifica)',
    required: false
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiProperty({ 
    description: 'Estado de empleo al que aplica este requisito',
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVO,
    required: false
  })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @ApiProperty({ 
    description: 'Indica si el documento es obligatorio',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiProperty({ 
    description: 'Orden de visualización',
    example: 1,
    default: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({ 
    description: 'Reglas de validación específicas para este requisito',
    required: false
  })
  @IsOptional()
  @IsObject()
  validationRules?: object;
}
