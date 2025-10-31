import { IsArray, ValidateNested, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class PaymentSplitDto {
  @ApiProperty({
    description: 'Payment method',
    example: 'cash',
    enum: ['cash', 'qris', 'debit', 'credit', 'transfer'],
  })
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: 'Amount paid with this method in cents',
    example: 50000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateSplitPaymentDto {
  @ApiProperty({
    description: 'Split payment details',
    type: [PaymentSplitDto],
    example: [
      { paymentMethod: 'cash', amount: 50000 },
      { paymentMethod: 'qris', amount: 50000 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentSplitDto)
  payments: PaymentSplitDto[];
}
