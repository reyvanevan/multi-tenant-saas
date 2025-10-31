import { IsString, IsUUID, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WhatsAppReceiptDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsUUID()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ description: 'WhatsApp phone number (format: 628xxxxxxxxxx)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^628\d{9,12}$/, {
    message: 'Phone number must start with 628 and be 12-15 digits',
  })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Custom message to send with receipt' })
  @IsString()
  @IsOptional()
  message?: string;
}
