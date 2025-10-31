import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateAlertSettingsDto, UpdateProductThresholdDto, GetAlertsQueryDto } from './dto';

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private auditLogsService: AuditLogsService,
  ) {}

  // ==================== LOW STOCK DETECTION ====================

  async checkLowStockProducts(tenantId: string, outletId?: string) {
    const where: any = {
      tenantId,
      isActive: true,
      deletedAt: null,
    };

    if (outletId) {
      where.outletId = outletId;
    }

    // Find products where currentStock <= minStock
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        ...where,
        currentStock: {
          lte: this.prisma.product.fields.minStock,
        },
      },
      include: {
        category: {
          select: { name: true },
        },
        outlet: {
          select: { name: true },
        },
        supplier: {
          select: { name: true, phone: true, email: true },
        },
      },
      orderBy: [
        { currentStock: 'asc' },
        { name: 'asc' },
      ],
    });

    return lowStockProducts.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      currentStock: product.currentStock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      categoryName: product.category?.name || null,
      outletName: product.outlet.name,
      supplierName: product.supplier?.name || null,
      supplierPhone: product.supplier?.phone || null,
      supplierEmail: product.supplier?.email || null,
      stockDifference: product.minStock - product.currentStock,
      severity: this.calculateSeverity(product.currentStock, product.minStock),
    }));
  }

  private calculateSeverity(currentStock: number, minStock: number): 'critical' | 'warning' | 'low' {
    const ratio = currentStock / minStock;
    
    if (currentStock <= 0) return 'critical';
    if (ratio <= 0.25) return 'critical'; // 25% or less of min stock
    if (ratio <= 0.5) return 'warning';   // 50% or less of min stock
    return 'low';
  }

  // ==================== ALERT SETTINGS ====================

  async getAlertSettings(tenantId: string, outletId: string) {
    let settings = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM alert_settings
      WHERE tenant_id = ${tenantId} AND outlet_id = ${outletId}
      LIMIT 1
    `;

    if (!settings || settings.length === 0) {
      // Return defaults
      return {
        tenantId,
        outletId,
        enableLowStockAlerts: true,
        enableEmailNotifications: false,
        enableWhatsAppNotifications: false,
        notificationEmails: null,
        notificationPhones: null,
        checkIntervalMinutes: 60, // Check every hour
        lastCheckedAt: null,
      };
    }

    return settings[0];
  }

  async updateAlertSettings(
    tenantId: string,
    outletId: string,
    userId: string,
    dto: UpdateAlertSettingsDto,
  ) {
    // Check if settings exist
    const existing = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM alert_settings
      WHERE tenant_id = ${tenantId} AND outlet_id = ${outletId}
      LIMIT 1
    `;

    let settings;

    if (!existing || existing.length === 0) {
      // Create new settings
      settings = await this.prisma.$executeRaw`
        INSERT INTO alert_settings (
          tenant_id, outlet_id, 
          enable_low_stock_alerts, enable_email_notifications, enable_whatsapp_notifications,
          notification_emails, notification_phones, check_interval_minutes
        )
        VALUES (
          ${tenantId}, ${outletId},
          ${dto.enableLowStockAlerts ?? true},
          ${dto.enableEmailNotifications ?? false},
          ${dto.enableWhatsAppNotifications ?? false},
          ${dto.notificationEmails || null},
          ${dto.notificationPhones || null},
          ${dto.checkIntervalMinutes ?? 60}
        )
      `;
    } else {
      // Update existing settings
      const updates: string[] = [];
      const params: any[] = [];

      if (dto.enableLowStockAlerts !== undefined) {
        updates.push(`enable_low_stock_alerts = $${params.length + 1}`);
        params.push(dto.enableLowStockAlerts);
      }
      if (dto.enableEmailNotifications !== undefined) {
        updates.push(`enable_email_notifications = $${params.length + 1}`);
        params.push(dto.enableEmailNotifications);
      }
      if (dto.enableWhatsAppNotifications !== undefined) {
        updates.push(`enable_whatsapp_notifications = $${params.length + 1}`);
        params.push(dto.enableWhatsAppNotifications);
      }
      if (dto.notificationEmails !== undefined) {
        updates.push(`notification_emails = $${params.length + 1}`);
        params.push(dto.notificationEmails);
      }
      if (dto.notificationPhones !== undefined) {
        updates.push(`notification_phones = $${params.length + 1}`);
        params.push(dto.notificationPhones);
      }
      if (dto.checkIntervalMinutes !== undefined) {
        updates.push(`check_interval_minutes = $${params.length + 1}`);
        params.push(dto.checkIntervalMinutes);
      }

      updates.push(`updated_at = NOW()`);

      await this.prisma.$executeRawUnsafe(`
        UPDATE alert_settings
        SET ${updates.join(', ')}
        WHERE tenant_id = '${tenantId}' AND outlet_id = '${outletId}'
      `);
    }

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      resource: 'ALERT_SETTINGS',
      resourceId: outletId,
      newValues: dto,
      ipAddress: '0.0.0.0',
    });

    return this.getAlertSettings(tenantId, outletId);
  }

  // ==================== PRODUCT THRESHOLD ====================

  async updateProductThreshold(
    tenantId: string,
    productId: string,
    userId: string,
    dto: UpdateProductThresholdDto,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        minStock: dto.minStock,
        maxStock: dto.maxStock,
      },
    });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      resource: 'PRODUCT_THRESHOLD',
      resourceId: productId,
      oldValues: {
        minStock: product.minStock,
        maxStock: product.maxStock,
      },
      newValues: dto,
      ipAddress: '0.0.0.0',
    });

    return updated;
  }

  // ==================== ALERT HISTORY ====================

  async getAlertHistory(
    tenantId: string,
    query: GetAlertsQueryDto,
  ) {
    const { productId, outletId, status, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (productId) where.productId = productId;
    if (outletId) where.outletId = outletId;
    if (status) where.status = status;

    const [alerts, total] = await Promise.all([
      this.prisma.$queryRaw<any[]>`
        SELECT * FROM stock_alerts
        WHERE tenant_id = ${tenantId}
        ${productId ? `AND product_id = ${productId}` : ''}
        ${outletId ? `AND outlet_id = ${outletId}` : ''}
        ${status ? `AND status = ${status}` : ''}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM stock_alerts
        WHERE tenant_id = ${tenantId}
        ${productId ? `AND product_id = ${productId}` : ''}
        ${outletId ? `AND outlet_id = ${outletId}` : ''}
        ${status ? `AND status = ${status}` : ''}
      `,
    ]);

    return {
      data: alerts,
      meta: {
        total: Number(total[0].count),
        page,
        limit,
        totalPages: Math.ceil(Number(total[0].count) / limit),
      },
    };
  }

  async dismissAlert(
    tenantId: string,
    alertId: string,
    userId: string,
    reason?: string,
  ) {
    await this.prisma.$executeRaw`
      UPDATE stock_alerts
      SET status = 'dismissed',
          dismissed_by = ${userId},
          dismissed_at = NOW(),
          dismiss_reason = ${reason || null}
      WHERE id = ${alertId} AND tenant_id = ${tenantId}
    `;

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      resource: 'STOCK_ALERT',
      resourceId: alertId,
      newValues: { status: 'dismissed', reason },
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  }

  // ==================== DASHBOARD WIDGET ====================

  async getLowStockSummary(tenantId: string, outletId?: string) {
    const lowStockProducts = await this.checkLowStockProducts(tenantId, outletId);

    const summary = {
      total: lowStockProducts.length,
      critical: lowStockProducts.filter(p => p.severity === 'critical').length,
      warning: lowStockProducts.filter(p => p.severity === 'warning').length,
      low: lowStockProducts.filter(p => p.severity === 'low').length,
      topItems: lowStockProducts.slice(0, 10), // Top 10 most urgent
    };

    return summary;
  }

  // ==================== NOTIFICATIONS (Placeholder) ====================

  async sendLowStockNotifications(tenantId: string, outletId: string) {
    const settings = await this.getAlertSettings(tenantId, outletId);

    if (!settings.enableLowStockAlerts) {
      return { sent: false, reason: 'Alerts disabled' };
    }

    const lowStockProducts = await this.checkLowStockProducts(tenantId, outletId);

    if (lowStockProducts.length === 0) {
      return { sent: false, reason: 'No low stock products' };
    }

    // TODO: Integrate with email service
    if (settings.enableEmailNotifications && settings.notificationEmails) {
      console.log('[Alerts] Would send email to:', settings.notificationEmails);
      // await this.emailService.sendLowStockAlert(...)
    }

    // TODO: Integrate with WhatsApp service
    if (settings.enableWhatsAppNotifications && settings.notificationPhones) {
      console.log('[Alerts] Would send WhatsApp to:', settings.notificationPhones);
      // await this.whatsappService.sendLowStockAlert(...)
    }

    return {
      sent: true,
      productsCount: lowStockProducts.length,
      criticalCount: lowStockProducts.filter(p => p.severity === 'critical').length,
    };
  }
}
