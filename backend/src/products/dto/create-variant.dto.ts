import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsJSON,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiProperty({
    description: 'Variant name (e.g., "Size M - Red")',
    example: 'Size M - Red',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Unique SKU for this variant',
    example: 'KOP-001-M-RED',
  })
  @IsString()
  sku: string;

  @ApiPropertyOptional({
    description: 'Barcode for this variant',
    example: '8992761121213',
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({
    description: 'Variant attributes (JSON)',
    example: { size: 'M', color: 'Red' },
  })
  @IsJSON()
  attributes: any;

  @ApiPropertyOptional({
    description: 'Cost price override in cents',
    example: 18000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Selling price override in cents',
    example: 28000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional({
    description: 'Current stock',
    example: 50,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({
    description: 'Is variant active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
