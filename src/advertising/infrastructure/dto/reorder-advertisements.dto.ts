import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class ReorderAdvertisementItemDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ReorderAdvertisementsDto {
  @ApiProperty({ type: [ReorderAdvertisementItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderAdvertisementItemDto)
  items: ReorderAdvertisementItemDto[];
}
