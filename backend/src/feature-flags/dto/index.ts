import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'offline_pos' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Offline POS' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Enable offline point of sale functionality',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'pos' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ example: ['business', 'pro'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  plans?: string[];

  @ApiPropertyOptional({ example: 50, description: 'Rollout percentage 0-100' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;

  @ApiPropertyOptional({ example: ['tenant-id-1', 'tenant-id-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rolloutTenants?: string[];

  @ApiPropertyOptional({ example: { maxUsers: 10 } })
  @IsOptional()
  metadata?: any;
}

export class UpdateFeatureFlagDto {
  @ApiPropertyOptional({ example: 'Offline POS' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  plans?: string[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rolloutTenants?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: any;
}

export class OverrideFeatureDto {
  @ApiProperty({ example: 'offline_pos' })
  @IsString()
  @IsNotEmpty()
  featureKey: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ example: { maxDevices: 5 } })
  @IsOptional()
  config?: any;
}
