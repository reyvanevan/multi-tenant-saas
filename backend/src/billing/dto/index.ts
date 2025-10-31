import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'uuid-of-plan' })
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ enum: BillingCycle, example: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;
}

export class ChangePlanDto {
  @ApiProperty({ example: 'uuid-of-new-plan' })
  @IsString()
  @IsNotEmpty()
  newPlanId: string;
}

export class MarkInvoicePaidDto {
  @ApiProperty({ example: 'bank_transfer' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'TRX-20240129-001' })
  @IsString()
  @IsOptional()
  paymentReference?: string;
}
