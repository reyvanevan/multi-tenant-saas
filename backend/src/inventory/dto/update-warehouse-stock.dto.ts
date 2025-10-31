import { IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWarehouseStockDto {
  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Reserved quantity',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reserved?: number;

  @ApiPropertyOptional({
    description: 'Batch number (Feature: batch_tracking)',
    example: 'BATCH-2025-001',
  })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({
    description: 'Expiry date (Feature: batch_tracking)',
    example: '2026-10-29T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Storage zone',
    example: 'A',
  })
  @IsOptional()
  @IsString()
  zone?: string;

  @ApiPropertyOptional({
    description: 'Storage rack',
    example: 'R1',
  })
  @IsOptional()
  @IsString()
  rack?: string;

  @ApiPropertyOptional({
    description: 'Storage bin',
    example: 'B01',
  })
  @IsOptional()
  @IsString()
  bin?: string;
}
