import { IsUUID, IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReceiptFormat {
  THERMAL_58MM = 'THERMAL_58MM',
  THERMAL_80MM = 'THERMAL_80MM',
  A4 = 'A4',
  HTML = 'HTML',
}

export class GenerateReceiptDto {
  @ApiProperty({ description: 'Transaction ID to generate receipt for' })
  @IsUUID()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Receipt format',
    enum: ReceiptFormat,
    default: ReceiptFormat.THERMAL_80MM,
  })
  @IsEnum(ReceiptFormat)
  format: ReceiptFormat;

  @ApiPropertyOptional({ description: 'Include QR code for payment verification' })
  @IsOptional()
  includeQrCode?: boolean;

  @ApiPropertyOptional({ description: 'Custom header text' })
  @IsString()
  @IsOptional()
  customHeader?: string;

  @ApiPropertyOptional({ description: 'Custom footer text' })
  @IsString()
  @IsOptional()
  customFooter?: string;
}
