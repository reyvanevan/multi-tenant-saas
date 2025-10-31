import { IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StockMovementType } from '@prisma/client';

class StockAdjustmentItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  productId: string;

  @ApiProperty({ description: 'Quantity adjustment', example: 10 })
  quantity: number;

  @ApiProperty({ 
    description: 'Adjustment type', 
    enum: StockMovementType,
    example: 'ADJUSTMENT_IN' 
  })
  type: StockMovementType;

  @ApiProperty({ description: 'Notes', example: 'Found in storage' })
  notes?: string;
}

export class CreateStockAdjustmentDto {
  @ApiProperty({
    description: 'Reason for adjustment',
    example: 'Physical count discrepancy',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Monthly stocktake adjustment',
  })
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Adjustment items',
    type: [StockAdjustmentItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockAdjustmentItemDto)
  items: StockAdjustmentItemDto[];
}
