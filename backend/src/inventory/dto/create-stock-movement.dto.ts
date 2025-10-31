import { IsString, IsNumber, IsUUID, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockMovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'uuid',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Movement type',
    enum: StockMovementType,
    example: 'ADJUSTMENT_IN',
  })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({
    description: 'Quantity (positive for IN, negative for OUT)',
    example: 10,
  })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({
    description: 'Reference type (transaction, adjustment, transfer, purchase)',
    example: 'adjustment',
  })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({
    description: 'Reference ID',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'Manual stock adjustment',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
