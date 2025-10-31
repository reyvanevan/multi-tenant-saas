import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Extended Prisma Service with tenant-scoped queries
 * Provides helper methods to automatically filter by tenantId
 */
@Injectable()
export class TenantPrismaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get Prisma client scoped to a specific tenant
   * All queries will automatically filter by tenantId
   */
  forTenant(tenantId: string) {
    return {
      // Users
      user: {
        findMany: (args?: any) =>
          this.prisma.user.findMany({
            ...args,
            where: { ...args?.where, tenantId },
          }),
        findUnique: (args: any) =>
          this.prisma.user.findFirst({
            ...args,
            where: { ...args.where, tenantId },
          }),
        findFirst: (args?: any) =>
          this.prisma.user.findFirst({
            ...args,
            where: { ...args?.where, tenantId },
          }),
        create: (args: any) =>
          this.prisma.user.create({
            ...args,
            data: { ...args.data, tenantId },
          }),
        update: (args: any) =>
          this.prisma.user.update({
            ...args,
            where: { ...args.where, tenantId },
          }),
        delete: (args: any) =>
          this.prisma.user.delete({
            ...args,
            where: { ...args.where, tenantId },
          }),
        count: (args?: any) =>
          this.prisma.user.count({
            ...args,
            where: { ...args?.where, tenantId },
          }),
      },

      // Outlets
      outlet: {
        findMany: (args?: any) =>
          this.prisma.outlet.findMany({
            ...args,
            where: { ...args?.where, tenantId },
          }),
        findUnique: (args: any) =>
          this.prisma.outlet.findFirst({
            ...args,
            where: { ...args.where, tenantId },
          }),
        findFirst: (args?: any) =>
          this.prisma.outlet.findFirst({
            ...args,
            where: { ...args?.where, tenantId },
          }),
        create: (args: any) =>
          this.prisma.outlet.create({
            ...args,
            data: { ...args.data, tenantId },
          }),
        update: (args: any) =>
          this.prisma.outlet.update({
            ...args,
            where: { ...args.where, tenantId },
          }),
        delete: (args: any) =>
          this.prisma.outlet.delete({
            ...args,
            where: { ...args.where, tenantId },
          }),
        count: (args?: any) =>
          this.prisma.outlet.count({
            ...args,
            where: { ...args?.where, tenantId },
          }),
      },

      // Roles
      role: {
        findMany: (args?: any) =>
          this.prisma.role.findMany({
            ...args,
            where: { ...args?.where, tenantId },
          }),
        findUnique: (args: any) =>
          this.prisma.role.findFirst({
            ...args,
            where: { ...args.where, tenantId },
          }),
        findFirst: (args?: any) =>
          this.prisma.role.findFirst({
            ...args,
            where: { ...args?.where, tenantId },
          }),
        create: (args: any) =>
          this.prisma.role.create({
            ...args,
            data: { ...args.data, tenantId },
          }),
        update: (args: any) =>
          this.prisma.role.update({
            ...args,
            where: { ...args.where, tenantId },
          }),
        delete: (args: any) =>
          this.prisma.role.delete({
            ...args,
            where: { ...args.where, tenantId },
          }),
        count: (args?: any) =>
          this.prisma.role.count({
            ...args,
            where: { ...args?.where, tenantId },
          }),
      },

      // Products
      product: {
        findMany: (args?: any) =>
          this.prisma.product.findMany({
            ...args,
            where: { ...args?.where, outlet: { tenantId } },
          }),
        findUnique: (args: any) =>
          this.prisma.product.findFirst({
            ...args,
            where: { ...args.where, outlet: { tenantId } },
          }),
        findFirst: (args?: any) =>
          this.prisma.product.findFirst({
            ...args,
            where: { ...args?.where, outlet: { tenantId } },
          }),
        create: (args: any) => this.prisma.product.create(args),
        update: (args: any) => this.prisma.product.update(args),
        delete: (args: any) => this.prisma.product.delete(args),
        count: (args?: any) =>
          this.prisma.product.count({
            ...args,
            where: { ...args?.where, outlet: { tenantId } },
          }),
      },

      // Transactions
      transaction: {
        findMany: (args?: any) =>
          this.prisma.transaction.findMany({
            ...args,
            where: { ...args?.where, outlet: { tenantId } },
          }),
        findUnique: (args: any) =>
          this.prisma.transaction.findFirst({
            ...args,
            where: { ...args.where, outlet: { tenantId } },
          }),
        findFirst: (args?: any) =>
          this.prisma.transaction.findFirst({
            ...args,
            where: { ...args?.where, outlet: { tenantId } },
          }),
        create: (args: any) => this.prisma.transaction.create(args),
        update: (args: any) => this.prisma.transaction.update(args),
        delete: (args: any) => this.prisma.transaction.delete(args),
        count: (args?: any) =>
          this.prisma.transaction.count({
            ...args,
            where: { ...args?.where, outlet: { tenantId } },
          }),
      },

      // Direct access to base prisma for complex queries
      $prisma: this.prisma,
    };
  }

  /**
   * Get base Prisma client (use with caution, bypasses tenant filtering)
   */
  getClient() {
    return this.prisma;
  }
}
