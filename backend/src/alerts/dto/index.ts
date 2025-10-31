import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';

export class UpdateAlertSettingsDto {
  @ApiProperty({ description: 'Enable/disable low stock alerts', required: false })
  @IsBoolean()
  @IsOptional()
  enableLowStockAlerts?: boolean;

  @ApiProperty({ description: 'Enable/disable email notifications', required: false })
  @IsBoolean()
  @IsOptional()
  enableEmailNotifications?: boolean;

  @ApiProperty({ description: 'Enable/disable WhatsApp notifications', required: false })
  @IsBoolean()
  @IsOptional()
  enableWhatsAppNotifications?: boolean;

  @ApiProperty({ description: 'Notification email addresses (comma-separated)', required: false })
  @IsString()
  @IsOptional()
  notificationEmails?: string;

  @ApiProperty({ description: 'Notification WhatsApp numbers (comma-separated)', required: false })
  @IsString()
  @IsOptional()
  notificationPhones?: string;

  @ApiProperty({ description: 'Check interval in minutes', required: false })
  @IsNumber()
  @Min(5)
  @IsOptional()
  checkIntervalMinutes?: number;
}

export class UpdateProductThresholdDto {
  @ApiProperty({ description: 'Minimum stock level before alert' })
  @IsNumber()
  @Min(0)
  minStock: number;

  @ApiProperty({ description: 'Maximum stock level (optional)', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStock?: number;
}

export class GetAlertsQueryDto {
  @ApiProperty({ description: 'Filter by product ID', required: false })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty({ description: 'Filter by outlet ID', required: false })
  @IsString()
  @IsOptional()
  outletId?: string;

  @ApiProperty({ description: 'Filter by status', required: false, enum: ['active', 'resolved', 'dismissed'] })
  @IsString()
  @IsOptional()
  status?: 'active' | 'resolved' | 'dismissed';

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 50 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;
}

export class DismissAlertDto {
  @ApiProperty({ description: 'Reason for dismissing the alert', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
