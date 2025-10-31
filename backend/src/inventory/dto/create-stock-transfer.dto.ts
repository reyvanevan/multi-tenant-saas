import { IsUUID, IsString, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class StockTransferItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid' })
  productId: string;

  @ApiProperty({ description: 'Quantity to transfer', example: 50 })
  quantityRequested: number;

  @ApiProperty({ description: 'Item notes', example: 'Handle with care' })
  notes?: string;
}

export class CreateStockTransferDto {
  @ApiProperty({
    description: 'Source outlet ID',
    example: 'uuid',
  })
  @IsUUID()
  fromOutletId: string;

  @ApiProperty({
    description: 'Destination outlet ID',
    example: 'uuid',
  })
  @IsUUID()
  toOutletId: string;

  @ApiPropertyOptional({
    description: 'Expected shipping date',
    example: '2025-10-30T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expectedShippingDate?: string;

  @ApiPropertyOptional({
    description: 'Transfer notes',
    example: 'Urgent transfer for new store opening',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Items to transfer',
    type: [StockTransferItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockTransferItemDto)
  items: StockTransferItemDto[];
}
