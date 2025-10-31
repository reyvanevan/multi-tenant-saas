import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiscountDto {
  @ApiProperty({ description: 'Discount name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Discount description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'BUNDLE'] })
  @IsEnum(['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'BUNDLE'])
  type: string;

  @ApiProperty({ enum: ['TRANSACTION', 'PRODUCT', 'CATEGORY'] })
  @IsEnum(['TRANSACTION', 'PRODUCT', 'CATEGORY'])
  scope: string;

  @ApiProperty({ description: 'Discount value (cents for FIXED, basis points for PERCENTAGE)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Minimum purchase amount (cents)' })
  @IsNumber()
  @IsOptional()
  minPurchase?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount (cents)' })
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Days of week (0=Sunday, 6=Saturday)', type: [Number] })
  @IsArray()
  @IsOptional()
  daysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'Start time (HH:mm format)' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm format)' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Applicable product IDs', type: [String] })
  @IsArray()
  @IsOptional()
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Applicable category IDs', type: [String] })
  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Applicable outlet IDs', type: [String] })
  @IsArray()
  @IsOptional()
  outletIds?: string[];

  @ApiPropertyOptional({ description: 'Buy quantity for Buy X Get Y discount' })
  @IsNumber()
  @IsOptional()
  buyQuantity?: number;

  @ApiPropertyOptional({ description: 'Get quantity for Buy X Get Y discount' })
  @IsNumber()
  @IsOptional()
  getQuantity?: number;

  @ApiPropertyOptional({ description: 'Maximum total usage' })
  @IsNumber()
  @IsOptional()
  maxUsage?: number;

  @ApiPropertyOptional({ description: 'Maximum usage per customer' })
  @IsNumber()
  @IsOptional()
  maxUsagePerCustomer?: number;

  @ApiPropertyOptional({ description: 'Voucher code' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Requires manager approval' })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Priority (higher = applies first)' })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Can combine with other discounts' })
  @IsBoolean()
  @IsOptional()
  isCombinable?: boolean;
}
