import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RecycleAdvertisementDto {
  @ApiProperty({ description: 'ID del histórico a reciclar' })
  @IsUUID()
  historyId: string;
}
