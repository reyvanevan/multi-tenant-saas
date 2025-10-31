import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Outlet ID where product is sold',
    example: 'uuid',
  })
  @IsUUID()
  outletId: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Kopi Susu Gula Aren',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Kopi susu dengan gula aren asli',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'SKU (Stock Keeping Unit)',
    example: 'KOP-001',
  })
  @IsString()
  sku: string;

  @ApiPropertyOptional({
    description: 'Barcode',
    example: '8992761121212',
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({
    description: 'Product category ID',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Supplier ID',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiProperty({
    description: 'Selling price in cents',
    example: 25000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({
    description: 'Cost price (COGS) in cents',
    example: 15000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({
    description: 'Current stock quantity',
    example: 100,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @ApiPropertyOptional({
    description: 'Minimum stock threshold for alerts',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({
    description: 'Maximum stock level',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional({
    description: 'Product unit (pcs, kg, liter, etc)',
    example: 'cup',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Track batch numbers (Feature: batch_tracking)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  trackBatch?: boolean;

  @ApiPropertyOptional({
    description: 'Track expiry dates (Feature: batch_tracking)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  trackExpiry?: boolean;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/product.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'Is product active for sale',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
