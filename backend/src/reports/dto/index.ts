import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum ReportPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  JSON = 'json',
  EXCEL = 'excel',
  PDF = 'pdf',
  CSV = 'csv',
}

export class GetReportQueryDto {
  @ApiProperty({ description: 'Report period', enum: ReportPeriod, required: false })
  @IsEnum(ReportPeriod)
  @IsOptional()
  period?: ReportPeriod;

  @ApiProperty({ description: 'Start date (for custom period)', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date (for custom period)', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Outlet ID filter', required: false })
  @IsString()
  @IsOptional()
  outletId?: string;

  @ApiProperty({ description: 'Report format', enum: ReportFormat, default: 'json', required: false })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;
}

export class EndOfDayReportQueryDto {
  @ApiProperty({ description: 'Shift ID', required: false })
  @IsString()
  @IsOptional()
  shiftId?: string;

  @ApiProperty({ description: 'Date (defaults to today)', required: false })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ description: 'Report format', enum: ReportFormat, default: 'json', required: false })
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;
}

export class ProductPerformanceQueryDto {
  @ApiProperty({ description: 'Start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Outlet ID filter', required: false })
  @IsString()
  @IsOptional()
  outletId?: string;

  @ApiProperty({ description: 'Category ID filter', required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Limit results', default: 50, required: false })
  @IsOptional()
  limit?: number;
}

export class CashierPerformanceQueryDto {
  @ApiProperty({ description: 'Start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'Outlet ID filter', required: false })
  @IsString()
  @IsOptional()
  outletId?: string;

  @ApiProperty({ description: 'User ID filter', required: false })
  @IsString()
  @IsOptional()
  userId?: string;
}
