import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, AuditStatus } from '@prisma/client';

export interface CreateAuditLogDto {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  status?: AuditStatus;
  errorMessage?: string;
}

export interface AuditLogFilters {
  tenantId: string;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  resourceId?: string;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(dto: CreateAuditLogDto) {
    try {
      // Calculate changes/diff if both old and new values provided
      const changes = this.calculateChanges(dto.oldValues, dto.newValues);

      const auditLog = await this.prisma.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.userId,
          action: dto.action,
          resource: dto.resource,
          resourceId: dto.resourceId,
          oldValues: dto.oldValues,
          newValues: dto.newValues,
          changes,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          metadata: dto.metadata,
          status: dto.status || 'SUCCESS',
          errorMessage: dto.errorMessage,
        },
      });

      return auditLog;
    } catch (error) {
      // Silent fail - don't break the main operation if audit logging fails
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  /**
   * Find all audit logs with filters
   */
  async findAll(filters: AuditLogFilters, page = 1, limit = 50) {
    const where: any = {
      tenantId: filters.tenantId,
    };

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.resource) {
      where.resource = filters.resource;
    }

    if (filters.resourceId) {
      where.resourceId = filters.resourceId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find audit log by ID
   */
  async findOne(tenantId: string, id: string) {
    return this.prisma.auditLog.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find audit logs for a specific resource
   */
  async findByResource(tenantId: string, resource: string, resourceId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        resource,
        resourceId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get audit statistics
   */
  async getStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, byAction, byResource, byStatus] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byAction,
      byResource,
      byStatus,
    };
  }

  /**
   * Helper: Calculate diff between old and new values
   */
  private calculateChanges(oldValues: any, newValues: any): any {
    if (!oldValues || !newValues) {
      return null;
    }

    const changes: any = {};

    // Compare all keys in newValues
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key],
        };
      }
    }

    // Check for deleted keys
    for (const key in oldValues) {
      if (!(key in newValues)) {
        changes[key] = {
          old: oldValues[key],
          new: null,
        };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  /**
   * Helper: Log CREATE action
   */
  async logCreate(
    tenantId: string,
    userId: string,
    resource: string,
    resourceId: string,
    newValues: any,
    metadata?: any,
  ) {
    return this.log({
      tenantId,
      userId,
      action: 'CREATE',
      resource,
      resourceId,
      newValues,
      metadata,
    });
  }

  /**
   * Helper: Log UPDATE action
   */
  async logUpdate(
    tenantId: string,
    userId: string,
    resource: string,
    resourceId: string,
    oldValues: any,
    newValues: any,
    metadata?: any,
  ) {
    return this.log({
      tenantId,
      userId,
      action: 'UPDATE',
      resource,
      resourceId,
      oldValues,
      newValues,
      metadata,
    });
  }

  /**
   * Helper: Log DELETE action
   */
  async logDelete(
    tenantId: string,
    userId: string,
    resource: string,
    resourceId: string,
    oldValues: any,
    metadata?: any,
  ) {
    return this.log({
      tenantId,
      userId,
      action: 'DELETE',
      resource,
      resourceId,
      oldValues,
      metadata,
    });
  }

  /**
   * Helper: Log LOGIN action
   */
  async logLogin(
    tenantId: string,
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any,
  ) {
    return this.log({
      tenantId,
      userId,
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      resource: 'auth',
      status: success ? 'SUCCESS' : 'FAILED',
      ipAddress,
      userAgent,
      metadata,
    });
  }

  /**
   * Cleanup old audit logs (for retention policy)
   */
  async cleanup(tenantId: string, olderThanDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        tenantId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      deleted: result.count,
      cutoffDate,
    };
  }
}
