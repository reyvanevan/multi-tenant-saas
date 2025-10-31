import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subscription, SubscriptionStatus, BillingCycle, InvoiceStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create subscription for tenant
   */
  async createSubscription(
    tenantId: string,
    planId: string,
    billingCycle: BillingCycle = BillingCycle.MONTHLY,
  ): Promise<Subscription> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('Plan is not active');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === BillingCycle.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Calculate amount
    const amount = billingCycle === BillingCycle.MONTHLY 
      ? plan.monthlyPrice 
      : (plan.annualPrice || plan.monthlyPrice * 12);

    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId,
        planId,
        startDate,
        endDate,
        billingCycle,
        amount,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
      },
      include: {
        plan: true,
      },
    });

    // Update tenant's plan reference
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planId,
        planExpiry: endDate,
      },
    });

    // Generate invoice
    await this.generateInvoice(subscription.id);

    this.logger.log(`Subscription created for tenant ${tenantId} with plan ${plan.name}`);

    return subscription;
  }

  /**
   * Get active subscription for tenant
   */
  async getActiveSubscription(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean = false) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (immediately) {
      // Cancel immediately
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelledAt: new Date(),
          autoRenew: false,
        },
      });

      // Update tenant status
      await this.prisma.tenant.update({
        where: { id: subscription.tenantId },
        data: {
          status: 'SUSPENDED',
        },
      });

      this.logger.log(`Subscription ${subscriptionId} cancelled immediately`);
    } else {
      // Cancel at end of period
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          autoRenew: false,
          cancelledAt: new Date(),
        },
      });

      this.logger.log(`Subscription ${subscriptionId} will cancel at end of period`);
    }
  }

  /**
   * Upgrade/Downgrade subscription
   */
  async changePlan(
    tenantId: string,
    newPlanId: string,
  ) {
    const currentSub = await this.getActiveSubscription(tenantId);
    if (!currentSub) {
      throw new NotFoundException('No active subscription found');
    }

    const newPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      throw new NotFoundException('New plan not found');
    }

    // Cancel current subscription
    await this.prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Create new subscription immediately
    const newSubscription = await this.createSubscription(
      tenantId,
      newPlanId,
      currentSub.billingCycle,
    );

    this.logger.log(`Plan changed for tenant ${tenantId} from ${currentSub.plan.name} to ${newPlan.name}`);

    return newSubscription;
  }

  /**
   * Renew subscription (auto or manual)
   */
  async renewSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Create new subscription period
    const startDate = new Date();
    const endDate = new Date();
    if (subscription.billingCycle === BillingCycle.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const newSubscription = await this.prisma.subscription.create({
      data: {
        tenantId: subscription.tenantId,
        planId: subscription.planId,
        startDate,
        endDate,
        billingCycle: subscription.billingCycle,
        amount: subscription.amount,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: subscription.autoRenew,
      },
      include: {
        plan: true,
      },
    });

    // Update old subscription
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    // Update tenant
    await this.prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: {
        planExpiry: endDate,
      },
    });

    // Generate invoice
    await this.generateInvoice(newSubscription.id);

    this.logger.log(`Subscription renewed for tenant ${subscription.tenantId}`);

    return newSubscription;
  }

  /**
   * Generate invoice for subscription
   */
  async generateInvoice(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Generate unique invoice number
    const count = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Calculate due date (7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const subtotal = subscription.amount;
    const tax = Math.round(subtotal * 0.11); // 11% PPN
    const total = subtotal + tax;

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        invoiceNumber,
        subtotal,
        tax,
        total,
        dueDate,
        status: InvoiceStatus.PENDING,
      },
    });

    this.logger.log(`Invoice ${invoiceNumber} generated for subscription ${subscriptionId}`);

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(
    invoiceId: string,
    paymentMethod: string,
    paymentReference?: string,
  ) {
    const invoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        paymentMethod,
        paymentReference,
      },
      include: {
        subscription: true,
      },
    });

    // If subscription was past due, reactivate it
    if (invoice.subscription && invoice.subscription.status === SubscriptionStatus.PAST_DUE) {
      await this.prisma.subscription.update({
        where: { id: invoice.subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await this.prisma.tenant.update({
        where: { id: invoice.tenantId },
        data: {
          status: 'ACTIVE',
        },
      });
    }

    this.logger.log(`Invoice ${invoice.invoiceNumber} marked as paid`);

    return invoice;
  }

  /**
   * Check subscription limits
   */
  async checkLimit(
    tenantId: string,
    resource: 'outlets' | 'products' | 'users' | 'storage',
  ): Promise<{ allowed: boolean; current: number; limit: number; usage: number }> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription) {
      throw new NotFoundException('No active subscription');
    }

    const plan = subscription.plan;
    let limit = 0;
    switch (resource) {
      case 'outlets':
        limit = plan.maxOutlets;
        break;
      case 'products':
        limit = plan.maxProducts;
        break;
      case 'users':
        limit = plan.maxUsers;
        break;
      case 'storage':
        limit = plan.maxStorage;
        break;
    }

    // Get current usage
    let current = 0;
    switch (resource) {
      case 'outlets':
        current = await this.prisma.outlet.count({ where: { tenantId } });
        break;
      case 'products':
        current = await this.prisma.product.count({
          where: { outlet: { tenantId } },
        });
        break;
      case 'users':
        current = await this.prisma.user.count({ where: { tenantId } });
        break;
      case 'storage':
        // TODO: Calculate actual storage usage
        current = 0;
        break;
    }

    const usage = limit > 0 ? Math.round((current / limit) * 100) : 0;
    const allowed = current < limit;

    return { allowed, current, limit, usage };
  }

  /**
   * Track usage
   */
  async trackUsage(tenantId: string, resource: string, amount: number) {
    await this.prisma.usageRecord.create({
      data: {
        tenantId,
        resource,
        amount,
      },
    });
  }

  /**
   * Get usage history
   */
  async getUsageHistory(tenantId: string, resource?: string) {
    return this.prisma.usageRecord.findMany({
      where: {
        tenantId,
        ...(resource && { resource }),
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: 100,
    });
  }

  /**
   * CRON: Check expiring subscriptions daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiringSubscriptions() {
    this.logger.log('🔍 Checking expiring subscriptions...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiringSubs = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lte: tomorrow,
        },
      },
      include: {
        tenant: true,
        plan: true,
      },
    });

    for (const sub of expiringSubs) {
      if (sub.autoRenew) {
        try {
          await this.renewSubscription(sub.id);
          this.logger.log(`✅ Auto-renewed subscription for tenant ${sub.tenant.name}`);
        } catch (error) {
          this.logger.error(`❌ Failed to auto-renew subscription ${sub.id}`, error);
        }
      } else {
        // Mark as expired
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: SubscriptionStatus.EXPIRED,
          },
        });

        await this.prisma.tenant.update({
          where: { id: sub.tenantId },
          data: {
            status: 'EXPIRED',
          },
        });

        this.logger.log(`⏰ Subscription expired for tenant ${sub.tenant.name}`);
      }
    }

    this.logger.log(`✨ Checked ${expiringSubs.length} expiring subscriptions`);
  }

  /**
   * CRON: Check overdue invoices daily
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkOverdueInvoices() {
    this.logger.log('🔍 Checking overdue invoices...');

    const now = new Date();
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PENDING,
        dueDate: {
          lt: now,
        },
      },
      include: {
        subscription: true,
      },
    });

    for (const invoice of overdueInvoices) {
      // Mark invoice as overdue
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.OVERDUE,
        },
      });

      // Mark subscription as past due
      if (invoice.subscription) {
        await this.prisma.subscription.update({
          where: { id: invoice.subscription.id },
          data: {
            status: SubscriptionStatus.PAST_DUE,
          },
        });

        await this.prisma.tenant.update({
          where: { id: invoice.tenantId },
          data: {
            status: 'SUSPENDED',
          },
        });
      }

      this.logger.log(`⚠️ Invoice ${invoice.invoiceNumber} is overdue`);
    }

    this.logger.log(`✨ Checked ${overdueInvoices.length} overdue invoices`);
  }
}
