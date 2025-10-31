import { IsEnum, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

enum TransferAction {
  APPROVE = 'APPROVE',
  SHIP = 'SHIP',
  RECEIVE = 'RECEIVE',
  CANCEL = 'CANCEL',
}

class TransferItemProcessDto {
  @ApiProperty({ description: 'Transfer item product ID' })
  productId: string;

  @ApiProperty({ description: 'Quantity actually shipped/received' })
  quantity: number;
}

export class ProcessStockTransferDto {
  @ApiProperty({
    description: 'Transfer action',
    enum: TransferAction,
    example: 'APPROVE',
  })
  @IsEnum(TransferAction)
  action: TransferAction;

  @ApiPropertyOptional({
    description: 'Items with actual quantities (for SHIP/RECEIVE)',
    type: [TransferItemProcessDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemProcessDto)
  items?: TransferItemProcessDto[];

  @ApiPropertyOptional({
    description: 'Processing notes',
    example: 'All items verified and packed',
  })
  notes?: string;
}
