import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OutletType {
  RETAIL = 'RETAIL',
  FNB = 'FNB',
  SALON = 'SALON',
  WORKSHOP = 'WORKSHOP',
  CLINIC = 'CLINIC',
  GYM = 'GYM',
  LAUNDRY = 'LAUNDRY',
  OTHER = 'OTHER',
}

export class CreateOutletDto {
  @ApiProperty({
    description: 'Outlet name',
    example: 'Toko Cabang Bandung',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Outlet code (unique within tenant)',
    example: 'BDG01',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Type of outlet',
    enum: OutletType,
    example: OutletType.RETAIL,
  })
  @IsEnum(OutletType)
  type: OutletType;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '022-1234567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'bandung@koperasi.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Full address',
    example: 'Jl. Merdeka No. 123',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Bandung',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Province',
    example: 'Jawa Barat',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '40111',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'Asia/Jakarta',
    default: 'Asia/Jakarta',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'IDR',
    default: 'IDR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Tax rate percentage',
    example: 11.0,
    default: 11.0,
  })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional({
    description: 'Is outlet active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
