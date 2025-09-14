import { IsOptional, IsString, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateLoanTypeDto } from './create-loan-type.dto';

export class UpdateLoanTypeDto extends PartialType(CreateLoanTypeDto) {
  @ApiPropertyOptional({ description: 'Indica si el tipo de préstamo está activo', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}



