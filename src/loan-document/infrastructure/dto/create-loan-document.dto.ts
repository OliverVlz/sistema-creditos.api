import { IsNotEmpty, IsString, IsUUID, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDocumentDto {
  @ApiProperty({ description: 'ID del préstamo' })
  @IsNotEmpty()
  @IsUUID()
  loanId: string;

  @ApiProperty({ description: 'ID del tipo de documento' })
  @IsNotEmpty()
  @IsUUID()
  documentTypeId: string;

  @ApiProperty({
    description: 'URL del documento',
    example: 'https://storage.example.com/docs/file.pdf',
  })
  @IsNotEmpty()
  @IsString()
  url: string;
}
