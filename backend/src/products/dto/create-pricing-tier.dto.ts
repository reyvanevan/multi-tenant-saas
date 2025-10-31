import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePricingTierDto {
  @ApiProperty({
    description: 'Tier name (e.g., "Wholesale", "Member", "VIP")',
    example: 'Wholesale',
  })
  @IsString()
  tierName: string;

  @ApiProperty({
    description: 'Minimum quantity for this tier',
    example: 10,
    minimum: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  minQuantity: number;

  @ApiPropertyOptional({
    description: 'Maximum quantity for this tier (null = no limit)',
    example: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;

  @ApiProperty({
    description: 'Price for this tier in cents',
    example: 22000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Is tier active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
