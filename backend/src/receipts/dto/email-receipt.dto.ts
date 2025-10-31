import { IsEmail, IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailReceiptDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsUUID()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Email subject' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ description: 'Additional message in email body' })
  @IsString()
  @IsOptional()
  message?: string;
}
