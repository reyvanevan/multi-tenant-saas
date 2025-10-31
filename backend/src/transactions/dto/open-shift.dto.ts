import { IsNumber, IsOptional, IsUUID, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({ description: 'Outlet ID where shift is opened' })
  @IsUUID()
  @IsNotEmpty()
  outletId: string;

  @ApiProperty({
    description: 'Opening cash amount in cents',
    example: 100000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  openingCash: number;

  @ApiPropertyOptional({
    description: 'Opening notes',
    example: 'Morning shift starting',
  })
  @IsOptional()
  openingNotes?: string;
}
