import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseOrderDto } from './create-purchase-order.dto';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {
  @ApiPropertyOptional({ 
    description: 'Purchase order status', 
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED'] 
  })
  @IsEnum(['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Approver user ID' })
  @IsString()
  @IsOptional()
  approvedBy?: string;
}
