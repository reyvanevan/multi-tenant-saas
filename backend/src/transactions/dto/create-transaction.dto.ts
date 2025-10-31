import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTransactionItemDto } from './create-transaction-item.dto';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Outlet ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  outletId: string;

  @ApiPropertyOptional({
    description: 'Shift ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiProperty({
    description: 'Transaction items (products)',
    type: [CreateTransactionItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];

  @ApiProperty({
    description: 'Payment method',
    example: 'cash',
    enum: ['cash', 'qris', 'debit', 'credit', 'transfer'],
  })
  @IsString()
  @IsIn(['cash', 'qris', 'debit', 'credit', 'transfer'])
  paymentMethod: string;

  @ApiPropertyOptional({
    description: 'Amount paid by customer in cents (for cash)',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({
    description: 'Transaction-level discount in cents',
    example: 5000,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Customer phone',
    example: '081234567890',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Idempotency key for offline sync',
    example: 'offline_123456789',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description: 'Local ID from offline app',
    example: 'local_abc123',
  })
  @IsOptional()
  @IsString()
  localId?: string;

  @ApiPropertyOptional({
    description: 'Is this synced from offline app',
    example: false,
    default: false,
  })
  @IsOptional()
  isOfflineSync?: boolean;
}
