import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional, IsUUID } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({
    description: 'Transaction ID to refund',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  transactionId: string;

  @ApiProperty({
    description: 'Refund amount in cents',
    example: 50000,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Reason for refund',
    example: 'Customer request - product defect',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Approved by user ID (for approval workflow)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;
}
