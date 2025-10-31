import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarehouseType } from '@prisma/client';

export class CreateWarehouseDto {
  @ApiProperty({
    description: 'Outlet ID',
    example: 'uuid',
  })
  @IsUUID()
  outletId: string;

  @ApiProperty({
    description: 'Warehouse code',
    example: 'WH-001',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Warehouse name',
    example: 'Main Warehouse',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Primary storage facility',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: 'Jl. Gudang No. 123',
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

  @ApiProperty({
    description: 'Warehouse type',
    enum: WarehouseType,
    example: 'MAIN',
  })
  @IsEnum(WarehouseType)
  type: WarehouseType;

  @ApiPropertyOptional({
    description: 'Maximum capacity',
    example: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCapacity?: number;
}
