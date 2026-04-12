import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdvertisementDto {
  @ApiProperty({ description: 'Título de la publicidad', maxLength: 120 })
  @IsString()
  @Length(1, 120)
  title: string;

  @ApiPropertyOptional({ description: 'URL de redirección al hacer click' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  })
  @IsUrl()
  targetUrl?: string;

  @ApiPropertyOptional({ description: 'Habilita redirección en click', default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isRedirectEnabled: boolean = false;

  @ApiPropertyOptional({ description: 'Estado activo', default: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive: boolean = true;

  @ApiPropertyOptional({ description: 'Orden en carrusel', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number = 0;

  @ApiPropertyOptional({ description: 'Fecha de inicio de vigencia' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @ApiPropertyOptional({ description: 'Fecha fin de vigencia' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endsAt?: Date;
}
