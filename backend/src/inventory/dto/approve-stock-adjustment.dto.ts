import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveStockAdjustmentDto {
  @ApiProperty({
    description: 'Approve (true) or reject (false)',
    example: true,
  })
  @IsBoolean()
  approved: boolean;

  @ApiPropertyOptional({
    description: 'Approval notes',
    example: 'Verified physical count',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
