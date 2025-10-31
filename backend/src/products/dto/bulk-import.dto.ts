import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';

export class BulkImportProductDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'CSV file' })
  file: any;
}

export class BulkImportOptionsDto {
  @ApiProperty({ description: 'Update existing products if SKU matches', default: false })
  @IsBoolean()
  @IsOptional()
  updateExisting?: boolean;

  @ApiProperty({ description: 'Skip validation errors and continue', default: false })
  @IsBoolean()
  @IsOptional()
  skipErrors?: boolean;

  @ApiProperty({ description: 'Batch size for processing', default: 100 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  batchSize?: number;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: ImportValidationError[];
  createdProducts?: string[];
  updatedProducts?: string[];
}

export interface ProductImportRow {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryName?: string;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
  maxStock?: number;
  unit?: string;
  isTaxable?: string; // 'yes'/'no'
  taxRate?: number;
  trackBatch?: string; // 'yes'/'no'
  trackExpiry?: string; // 'yes'/'no'
  // Variants (comma-separated)
  variantName?: string;
  variantSku?: string;
  variantPrice?: number;
  // Pricing Tiers (format: "tier1:price1,tier2:price2")
  pricingTiers?: string;
}
