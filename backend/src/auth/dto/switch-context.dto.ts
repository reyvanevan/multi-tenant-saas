import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SwitchContextDto {
  @ApiProperty({
    description: 'Tenant ID to switch to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({
    description: 'Outlet ID to switch to',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  outletId?: string;
}
