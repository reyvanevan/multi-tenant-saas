import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from './audit-logs.service';

@Injectable()
export class AuditLogsCronService {
  private readonly logger = new Logger(AuditLogsCronService.name);
  private readonly DEFAULT_RETENTION_DAYS = 90;

  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
  ) {}

  /**
   * Run cleanup daily at 2 AM
   * Removes audit logs older than retention period for each tenant
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleAuditLogCleanup() {
    this.logger.log('Starting audit log cleanup cron job...');

    try {
      // Get all tenants
      const tenants = await this.prisma.tenant.findMany({
        select: { id: true, name: true },
      });

      let totalCleaned = 0;

      for (const tenant of tenants) {
        try {
          // TODO: In production, get retention period from tenant settings
          // For now, use default 90 days
          const retentionDays = this.DEFAULT_RETENTION_DAYS;

          const result = await this.auditLogs.cleanup(tenant.id, retentionDays);

          if (result.deleted > 0) {
            this.logger.log(
              `Cleaned up ${result.deleted} audit logs for tenant ${tenant.name} (older than ${retentionDays} days)`,
            );
            totalCleaned += result.deleted;
          }
        } catch (error) {
          this.logger.error(
            `Failed to cleanup audit logs for tenant ${tenant.name}:`,
            error,
          );
          // Continue with next tenant
        }
      }

      this.logger.log(
        `Audit log cleanup completed. Total cleaned: ${totalCleaned} records`,
      );
    } catch (error) {
      this.logger.error('Audit log cleanup cron job failed:', error);
    }
  }

  /**
   * Manual cleanup trigger for testing
   * Can be called directly for immediate cleanup
   */
  async manualCleanup(tenantId: string, retentionDays?: number) {
    this.logger.log(`Manual cleanup triggered for tenant ${tenantId}...`);

    const days = retentionDays || this.DEFAULT_RETENTION_DAYS;
    const result = await this.auditLogs.cleanup(tenantId, days);

    this.logger.log(
      `Manual cleanup completed. Deleted ${result.deleted} audit logs (older than ${days} days)`,
    );

    return result;
  }
}
