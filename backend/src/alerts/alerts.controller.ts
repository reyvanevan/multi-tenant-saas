import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import {
  UpdateAlertSettingsDto,
  UpdateProductThresholdDto,
  GetAlertsQueryDto,
  DismissAlertDto,
} from './dto';

interface UserPayload {
  userId: string;
  username: string;
  tenantId: string;
  outletId?: string;
}

@ApiTags('Alerts')
@ApiBearerAuth('JWT-auth')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  // ==================== LOW STOCK PRODUCTS ====================

  @Get('low-stock')
  @RequirePermissions('alerts.view')
  @ApiOperation({ summary: 'Get low stock products' })
  async getLowStockProducts(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.alertsService.checkLowStockProducts(tenantId, outletId);
  }

  @Get('low-stock/summary')
  @RequirePermissions('alerts.view')
  @ApiOperation({ summary: 'Get low stock summary for dashboard' })
  async getLowStockSummary(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.alertsService.getLowStockSummary(tenantId, outletId);
  }

  // ==================== ALERT SETTINGS ====================

  @Get('settings/:outletId')
  @RequirePermissions('alerts.settings.view')
  @ApiOperation({ summary: 'Get alert settings for an outlet' })
  async getAlertSettings(
    @TenantId() tenantId: string,
    @Param('outletId') outletId: string,
  ) {
    return this.alertsService.getAlertSettings(tenantId, outletId);
  }

  @Patch('settings/:outletId')
  @RequirePermissions('alerts.settings.update')
  @ApiOperation({ summary: 'Update alert settings' })
  async updateAlertSettings(
    @TenantId() tenantId: string,
    @CurrentUser() user: UserPayload,
    @Param('outletId') outletId: string,
    @Body() dto: UpdateAlertSettingsDto,
  ) {
    return this.alertsService.updateAlertSettings(tenantId, outletId, user.userId, dto);
  }

  // ==================== PRODUCT THRESHOLD ====================

  @Patch('products/:productId/threshold')
  @RequirePermissions('products.update')
  @ApiOperation({ summary: 'Update product stock threshold' })
  async updateProductThreshold(
    @TenantId() tenantId: string,
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductThresholdDto,
  ) {
    return this.alertsService.updateProductThreshold(tenantId, productId, user.userId, dto);
  }

  // ==================== ALERT HISTORY ====================

  @Get('history')
  @RequirePermissions('alerts.view')
  @ApiOperation({ summary: 'Get alert history' })
  async getAlertHistory(
    @TenantId() tenantId: string,
    @Query() query: GetAlertsQueryDto,
  ) {
    return this.alertsService.getAlertHistory(tenantId, query);
  }

  @Post('history/:alertId/dismiss')
  @RequirePermissions('alerts.dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  async dismissAlert(
    @TenantId() tenantId: string,
    @CurrentUser() user: UserPayload,
    @Param('alertId') alertId: string,
    @Body() dto: DismissAlertDto,
  ) {
    return this.alertsService.dismissAlert(tenantId, alertId, user.userId, dto.reason);
  }

  // ==================== NOTIFICATIONS ====================

  @Post('notifications/send/:outletId')
  @RequirePermissions('alerts.notifications.send')
  @ApiOperation({ summary: 'Manually trigger low stock notifications' })
  async sendNotifications(
    @TenantId() tenantId: string,
    @Param('outletId') outletId: string,
  ) {
    return this.alertsService.sendLowStockNotifications(tenantId, outletId);
  }
}
