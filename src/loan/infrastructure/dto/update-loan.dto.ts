import {
  IsUUID,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LoanStatus } from '../entity/loan.entity';

class UpdateDocumentItemDto {
  @ApiProperty({ description: 'ID del documento a actualizar' })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Nueva URL del documento',
    example: 'https://storage.example.com/docs/cedula-corregida.pdf',
  })
  @IsNotEmpty()
  @IsString()
  url: string;
}

export class UpdateLoanDto {
  @ApiPropertyOptional({
    description: 'Estado del préstamo',
    enum: LoanStatus,
    example: LoanStatus.APROBADO,
  })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional({
    description: 'Razón de rechazo (requerido si status es rechazado)',
    example: 'Documentación incompleta',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que gestiona el préstamo',
  })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({
    description: 'Documentos a actualizar (opcional)',
    type: [UpdateDocumentItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDocumentItemDto)
  documents?: UpdateDocumentItemDto[];
}
