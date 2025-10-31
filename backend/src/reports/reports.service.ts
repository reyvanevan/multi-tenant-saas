import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GetReportQueryDto,
  EndOfDayReportQueryDto,
  ProductPerformanceQueryDto,
  CashierPerformanceQueryDto,
  ReportPeriod,
} from './dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ==================== HELPER: DATE RANGE ====================

  private getDateRange(period?: ReportPeriod, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    if (period === ReportPeriod.CUSTOM && startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case ReportPeriod.TODAY:
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date(now.setHours(23, 59, 59, 999));
          break;
        case ReportPeriod.YESTERDAY:
          start = new Date(now.setDate(now.getDate() - 1));
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          break;
        case ReportPeriod.THIS_WEEK:
          const dayOfWeek = now.getDay();
          start = new Date(now.setDate(now.getDate() - dayOfWeek));
          start.setHours(0, 0, 0, 0);
          end = new Date();
          break;
        case ReportPeriod.LAST_WEEK:
          const lastWeekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7));
          start = new Date(lastWeekStart.setHours(0, 0, 0, 0));
          end = new Date(now.setDate(start.getDate() + 6));
          end.setHours(23, 59, 59, 999);
          break;
        case ReportPeriod.THIS_MONTH:
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date();
          break;
        case ReportPeriod.LAST_MONTH:
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        default:
          // Last 30 days
          start = new Date(now.setDate(now.getDate() - 30));
          start.setHours(0, 0, 0, 0);
          end = new Date();
      }
    }

    return { start, end };
  }

  // ==================== SALES REPORT ====================

  async getSalesReport(tenantId: string, query: GetReportQueryDto) {
    const { start, end } = this.getDateRange(query.period, query.startDate, query.endDate);
    const { outletId } = query;

    const where: any = {
      tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      status: 'COMPLETED',
      deletedAt: null,
    };

    if (outletId) {
      where.outletId = outletId;
    }

    // Get transactions
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        items: true,
        outlet: {
          select: { name: true },
        },
        user: {
          select: { username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    const summary = {
      totalTransactions: transactions.length,
      totalRevenue: transactions.reduce((sum, t) => sum + t.total, 0),
      totalDiscount: transactions.reduce((sum, t) => sum + t.discount, 0),
      totalTax: transactions.reduce((sum, t) => sum + t.tax, 0),
      totalItems: transactions.reduce((sum, t) => sum + t.items.length, 0),
      averageTransaction: transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.total, 0) / transactions.length
        : 0,
    };

    // Group by payment method
    const paymentMethods = transactions.reduce((acc: any, t) => {
      if (!acc[t.paymentMethod]) {
        acc[t.paymentMethod] = { count: 0, total: 0 };
      }
      acc[t.paymentMethod].count++;
      acc[t.paymentMethod].total += t.total;
      return acc;
    }, {});

    // Group by date (daily)
    const dailySales = transactions.reduce((acc: any, t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { transactions: 0, revenue: 0 };
      }
      acc[date].transactions++;
      acc[date].revenue += t.total;
      return acc;
    }, {});

    // Group by hour (for today)
    const hourlySales = transactions
      .filter(t => {
        const today = new Date();
        return t.createdAt.toDateString() === today.toDateString();
      })
      .reduce((acc: any, t) => {
        const hour = t.createdAt.getHours();
        if (!acc[hour]) {
          acc[hour] = { transactions: 0, revenue: 0 };
        }
        acc[hour].transactions++;
        acc[hour].revenue += t.total;
        return acc;
      }, {});

    return {
      period: {
        start,
        end,
        label: query.period || 'custom',
      },
      summary,
      paymentMethods,
      dailySales,
      hourlySales,
      transactions: transactions.slice(0, 100), // Limit to 100 recent
    };
  }

  // ==================== END OF DAY REPORT ====================

  async getEndOfDayReport(tenantId: string, outletId: string, query: EndOfDayReportQueryDto) {
    const date = query.date ? new Date(query.date) : new Date();
    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));

    const where: any = {
      tenantId,
      outletId,
      createdAt: {
        gte: start,
        lte: end,
      },
      deletedAt: null,
    };

    if (query.shiftId) {
      where.shiftId = query.shiftId;
    }

    // Get all transactions
    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...where,
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, categoryId: true },
            },
          },
        },
      },
    });

    // Get refunds
    const refunds = await this.prisma.refund.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Summary
    const summary = {
      date: start,
      totalTransactions: transactions.length,
      totalRevenue: transactions.reduce((sum, t) => sum + t.total, 0),
      totalDiscount: transactions.reduce((sum, t) => sum + t.discount, 0),
      totalTax: transactions.reduce((sum, t) => sum + t.tax, 0),
      totalRefunds: refunds.reduce((sum, r) => sum + r.amount, 0),
      netRevenue: transactions.reduce((sum, t) => sum + t.total, 0) - refunds.reduce((sum, r) => sum + r.amount, 0),
    };

    // Payment breakdown
    const paymentBreakdown = transactions.reduce((acc: any, t) => {
      if (!acc[t.paymentMethod]) {
        acc[t.paymentMethod] = { count: 0, total: 0 };
      }
      acc[t.paymentMethod].count++;
      acc[t.paymentMethod].total += t.total;
      return acc;
    }, {});

    // Cash handling
    const cashTransactions = transactions.filter(t => t.paymentMethod === 'cash');
    const cashSummary = {
      totalCashSales: cashTransactions.reduce((sum, t) => sum + t.total, 0),
      totalCashReceived: cashTransactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0),
      totalChange: cashTransactions.reduce((sum, t) => sum + (t.changeAmount || 0), 0),
      expectedCashInDrawer: cashTransactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0) -
        cashTransactions.reduce((sum, t) => sum + (t.changeAmount || 0), 0),
    };

    // Top selling products
    const productSales = transactions
      .flatMap(t => t.items)
      .reduce((acc: any, item) => {
        const key = item.productId;
        if (!acc[key]) {
          acc[key] = {
            productId: item.productId,
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        acc[key].quantity += item.quantity;
        acc[key].revenue += item.subtotal;
        return acc;
      }, {});

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      summary,
      paymentBreakdown,
      cashSummary,
      topProducts,
      refunds: refunds.map(r => ({
        id: r.id,
        transactionId: r.transactionId,
        amount: r.amount,
        reason: r.reason,
        createdAt: r.createdAt,
      })),
    };
  }

  // ==================== PRODUCT PERFORMANCE ====================

  async getProductPerformance(tenantId: string, query: ProductPerformanceQueryDto) {
    const { start, end } = this.getDateRange(
      undefined,
      query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      query.endDate || new Date().toISOString(),
    );

    const where: any = {
      tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      status: 'COMPLETED',
      deletedAt: null,
    };

    if (query.outletId) {
      where.outletId = query.outletId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                categoryId: true,
                costPrice: true,
                sellingPrice: true,
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    // Aggregate product sales
    const productStats = transactions
      .flatMap(t => t.items)
      .reduce((acc: any, item) => {
        const key = item.productId;
        if (!acc[key]) {
          acc[key] = {
            productId: item.productId,
            productName: item.productName,
            productSku: item.product?.sku || item.productSku,
            categoryName: item.product?.category?.name || null,
            quantitySold: 0,
            revenue: 0,
            costPrice: item.product?.costPrice || 0,
            sellingPrice: item.product?.sellingPrice || 0,
            profit: 0,
            transactionCount: 0,
          };
        }
        acc[key].quantitySold += item.quantity;
        acc[key].revenue += item.subtotal;
        acc[key].profit += item.subtotal - (item.product?.costPrice || 0) * item.quantity;
        acc[key].transactionCount++;
        return acc;
      }, {});

    // Convert to array and sort
    const bestSellers = Object.values(productStats)
      .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
      .slice(0, query.limit || 50);

    const topRevenue = Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, query.limit || 50);

    const topProfit = Object.values(productStats)
      .sort((a: any, b: any) => b.profit - a.profit)
      .slice(0, query.limit || 50);

    // Find slow movers (low sales)
    const slowMovers = Object.values(productStats)
      .sort((a: any, b: any) => a.quantitySold - b.quantitySold)
      .slice(0, query.limit || 50);

    return {
      period: { start, end },
      bestSellers,
      topRevenue,
      topProfit,
      slowMovers,
      totalProducts: Object.keys(productStats).length,
    };
  }

  // ==================== CASHIER PERFORMANCE ====================

  async getCashierPerformance(tenantId: string, query: CashierPerformanceQueryDto) {
    const { start, end } = this.getDateRange(
      undefined,
      query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      query.endDate || new Date().toISOString(),
    );

    const where: any = {
      tenantId,
      createdAt: {
        gte: start,
        lte: end,
      },
      status: 'COMPLETED',
      deletedAt: null,
    };

    if (query.outletId) {
      where.outletId = query.outletId;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        items: true,
      },
    });

    // Aggregate by cashier
    const cashierStats = transactions.reduce((acc: any, t) => {
      const key = t.userId;
      if (!acc[key]) {
        acc[key] = {
          userId: t.userId,
          username: t.user.username,
          email: t.user.email,
          transactionCount: 0,
          totalRevenue: 0,
          totalDiscount: 0,
          totalItems: 0,
          averageTransaction: 0,
          averageItems: 0,
        };
      }
      acc[key].transactionCount++;
      acc[key].totalRevenue += t.total;
      acc[key].totalDiscount += t.discount;
      acc[key].totalItems += t.items.length;
      return acc;
    }, {});

    // Calculate averages
    Object.values(cashierStats).forEach((stats: any) => {
      stats.averageTransaction = stats.totalRevenue / stats.transactionCount;
      stats.averageItems = stats.totalItems / stats.transactionCount;
    });

    // Sort by revenue
    const performance = Object.values(cashierStats)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    return {
      period: { start, end },
      performance,
      totalCashiers: performance.length,
    };
  }

  // ==================== INVENTORY VALUATION ====================

  async getInventoryValuation(tenantId: string, outletId?: string) {
    const where: any = {
      tenantId,
      isActive: true,
      deletedAt: null,
    };

    if (outletId) {
      where.outletId = outletId;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    const valuation = products.map(p => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      categoryName: p.category?.name || null,
      currentStock: p.currentStock,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      totalCostValue: p.currentStock * p.costPrice,
      totalSellingValue: p.currentStock * p.sellingPrice,
      potentialProfit: p.currentStock * (p.sellingPrice - p.costPrice),
    }));

    const summary = {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.currentStock, 0),
      totalCostValue: valuation.reduce((sum, v) => sum + v.totalCostValue, 0),
      totalSellingValue: valuation.reduce((sum, v) => sum + v.totalSellingValue, 0),
      totalPotentialProfit: valuation.reduce((sum, v) => sum + v.potentialProfit, 0),
    };

    return {
      summary,
      products: valuation.sort((a, b) => b.totalCostValue - a.totalCostValue),
    };
  }

  // ==================== PROFIT MARGIN ANALYSIS ====================

  async getProfitMarginAnalysis(tenantId: string, query: GetReportQueryDto) {
    const { start, end } = this.getDateRange(query.period, query.startDate, query.endDate);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        ...(query.outletId && { outletId: query.outletId }),
        createdAt: {
          gte: start,
          lte: end,
        },
        status: 'COMPLETED',
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                costPrice: true,
                sellingPrice: true,
              },
            },
          },
        },
      },
    });

    let totalRevenue = 0;
    let totalCost = 0;

    transactions.forEach(t => {
      t.items.forEach(item => {
        totalRevenue += item.subtotal;
        totalCost += (item.product?.costPrice || 0) * item.quantity;
      });
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      period: { start, end },
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      transactionCount: transactions.length,
    };
  }
}
