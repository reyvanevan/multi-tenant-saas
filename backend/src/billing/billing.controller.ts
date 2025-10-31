import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateSubscriptionDto,
  ChangePlanDto,
  MarkInvoicePaidDto,
} from './dto';

@ApiTags('Billing & Subscriptions')
@ApiBearerAuth()
@Controller({ path: 'billing', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Get current active subscription' })
  @ApiResponse({ status: 200, description: 'Active subscription details' })
  async getSubscription(@CurrentUser() user: { tenantId: string }) {
    const subscription = await this.billingService.getActiveSubscription(
      user.tenantId,
    );
    return { subscription };
  }

  @Post('subscription')
  @RequirePermissions('manage_billing')
  @ApiOperation({ summary: 'Create new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async createSubscription(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: CreateSubscriptionDto,
  ) {
    const subscription = await this.billingService.createSubscription(
      user.tenantId,
      dto.planId,
      dto.billingCycle,
    );
    return { subscription };
  }

  @Put('subscription/change-plan')
  @RequirePermissions('manage_billing')
  @ApiOperation({ summary: 'Upgrade or downgrade plan' })
  @ApiResponse({ status: 200, description: 'Plan changed successfully' })
  async changePlan(
    @CurrentUser() user: { tenantId: string },
    @Body() dto: ChangePlanDto,
  ) {
    const subscription = await this.billingService.changePlan(
      user.tenantId,
      dto.newPlanId,
    );
    return { subscription };
  }

  @Post('subscription/:id/cancel')
  @RequirePermissions('manage_billing')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(
    @Param('id') id: string,
    @Query('immediately') immediately?: string,
  ) {
    await this.billingService.cancelSubscription(
      id,
      immediately === 'true',
    );
    return { message: 'Subscription cancelled' };
  }

  @Post('subscription/:id/renew')
  @RequirePermissions('manage_billing')
  @ApiOperation({ summary: 'Manually renew subscription' })
  @ApiResponse({ status: 200, description: 'Subscription renewed' })
  async renewSubscription(@Param('id') id: string) {
    const subscription = await this.billingService.renewSubscription(id);
    return { subscription };
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices for tenant' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async listInvoices(@CurrentUser() user: { tenantId: string }) {
    // TODO: Add pagination
    const invoices = await this.billingService['prisma'].invoice.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { invoices };
  }

  @Post('invoices/:id/pay')
  @RequirePermissions('manage_billing')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  async markInvoicePaid(
    @Param('id') id: string,
    @Body() dto: MarkInvoicePaidDto,
  ) {
    const invoice = await this.billingService.markInvoicePaid(
      id,
      dto.paymentMethod,
      dto.paymentReference,
    );
    return { invoice };
  }

  @Get('limits')
  @ApiOperation({ summary: 'Get current usage limits and stats' })
  @ApiResponse({ status: 200, description: 'Usage limits and current usage' })
  async getLimits(@CurrentUser() user: { tenantId: string }) {
    const [outlets, products, users, storage] = await Promise.all([
      this.billingService.checkLimit(user.tenantId, 'outlets'),
      this.billingService.checkLimit(user.tenantId, 'products'),
      this.billingService.checkLimit(user.tenantId, 'users'),
      this.billingService.checkLimit(user.tenantId, 'storage'),
    ]);

    return {
      limits: {
        outlets,
        products,
        users,
        storage,
      },
    };
  }

  @Get('usage-history')
  @ApiOperation({ summary: 'Get usage history' })
  @ApiResponse({ status: 200, description: 'Usage history records' })
  async getUsageHistory(
    @CurrentUser() user: { tenantId: string },
    @Query('resource') resource?: string,
  ) {
    const records = await this.billingService.getUsageHistory(
      user.tenantId,
      resource,
    );
    return { records };
  }

  // Admin endpoints
  @Get('admin/plans')
  @RequirePermissions('manage_subscription_plans')
  @ApiOperation({ summary: 'List all subscription plans (Admin)' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  async listPlans() {
    const plans = await this.billingService['prisma'].subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    });
    return { plans };
  }

  @Get('admin/subscriptions')
  @RequirePermissions('manage_all_subscriptions')
  @ApiOperation({ summary: 'List all subscriptions (Admin)' })
  @ApiResponse({ status: 200, description: 'List of subscriptions' })
  async listAllSubscriptions(
    @Query('status') status?: string,
    @Query('planId') planId?: string,
  ) {
    const subscriptions = await this.billingService['prisma'].subscription.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(planId && { planId }),
      },
      include: {
        tenant: true,
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { subscriptions };
  }
}
