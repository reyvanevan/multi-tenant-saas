import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseShiftDto {
  @ApiProperty({
    description: 'Actual closing cash amount in cents',
    example: 500000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  closingCash: number;

  @ApiPropertyOptional({
    description: 'Closing notes',
    example: 'Evening shift complete',
  })
  @IsOptional()
  closingNotes?: string;
}
