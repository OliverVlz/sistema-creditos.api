import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoanDocumentStatus } from '../entity/loan-document.entity';

export class UpdateLoanDocumentDto {
  @ApiProperty({ description: 'Nueva URL del documento', required: false })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({
    description: 'Nuevo estado del documento',
    enum: LoanDocumentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(LoanDocumentStatus)
  status?: LoanDocumentStatus;

  @ApiProperty({ description: 'Nota de rechazo', required: false })
  @IsOptional()
  @IsString()
  rejectionNote?: string;
}

