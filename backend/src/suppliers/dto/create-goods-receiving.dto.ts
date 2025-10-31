import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoodsReceivingItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity expected' })
  @IsNumber()
  @Min(0)
  quantityExpected: number;

  @ApiProperty({ description: 'Quantity actually received' })
  @IsNumber()
  @Min(0)
  quantityReceived: number;

  @ApiPropertyOptional({ 
    description: 'Quality status', 
    enum: ['ACCEPTED', 'DAMAGED', 'REJECTED'],
    default: 'ACCEPTED'
  })
  @IsEnum(['ACCEPTED', 'DAMAGED', 'REJECTED'])
  @IsOptional()
  qualityStatus?: string;

  @ApiPropertyOptional({ description: 'Batch number (if batch tracking enabled)' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiry date (if batch tracking enabled)' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Notes for this item' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateGoodsReceivingDto {
  @ApiProperty({ description: 'Purchase Order ID' })
  @IsString()
  @IsNotEmpty()
  purchaseOrderId: string;

  @ApiProperty({ description: 'Outlet ID' })
  @IsString()
  @IsNotEmpty()
  outletId: string;

  @ApiPropertyOptional({ description: 'Warehouse ID' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiProperty({ description: 'User ID who received the goods' })
  @IsString()
  @IsNotEmpty()
  receivedBy: string;

  @ApiProperty({ description: 'Goods receiving items', type: [GoodsReceivingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsReceivingItemDto)
  items: GoodsReceivingItemDto[];

  @ApiPropertyOptional({ description: 'General notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Discrepancy notes (for quantity differences)' })
  @IsString()
  @IsOptional()
  discrepancyNotes?: string;
}
