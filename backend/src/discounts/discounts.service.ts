import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { Prisma, DiscountType, DiscountScope } from '@prisma/client';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  categoryId?: string;
}

export interface ApplicableDiscount {
  discountId: string;
  name: string;
  type: string;
  amount: number;
  applicableItems: CartItem[];
}

@Injectable()
export class DiscountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(tenantId: string, createDiscountDto: CreateDiscountDto, userId: string) {
    this.validateDiscountConfig(createDiscountDto);

    if (createDiscountDto.code) {
      const existingDiscount = await this.prisma.discount.findFirst({
        where: { tenantId, code: createDiscountDto.code },
      });
      if (existingDiscount) {
        throw new ConflictException('Discount code already exists');
      }
    }

    const discount = await this.prisma.discount.create({
      data: {
        ...createDiscountDto,
        type: createDiscountDto.type as DiscountType,
        scope: createDiscountDto.scope as DiscountScope,
        tenantId,
        createdBy: userId,
        currentUsage: 0,
      },
    });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'CREATE',
      resource: 'DISCOUNTS',
      resourceId: discount.id,
      newValues: discount,
      ipAddress: '0.0.0.0',
    });

    return discount;
  }

  async findAll(tenantId: string, filters?: { isActive?: boolean; type?: string; outletId?: string }) {
    const where: Prisma.DiscountWhereInput = { tenantId };
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.type) where.type = filters.type as DiscountType;
    if (filters?.outletId) where.outletIds = { has: filters.outletId };

    return this.prisma.discount.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const discount = await this.prisma.discount.findFirst({
      where: { id, tenantId },
      include: {
        usages: { take: 50, orderBy: { appliedAt: 'desc' } },
      },
    });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async update(tenantId: string, id: string, updateDiscountDto: UpdateDiscountDto, userId: string) {
    const discount = await this.findOne(tenantId, id);
    if (Object.keys(updateDiscountDto).length > 0) {
      this.validateDiscountConfig(updateDiscountDto as any);
    }

    if (updateDiscountDto.code && updateDiscountDto.code !== discount.code) {
      const existingDiscount = await this.prisma.discount.findFirst({
        where: { tenantId, code: updateDiscountDto.code, id: { not: id } },
      });
      if (existingDiscount) {
        throw new ConflictException('Discount code already exists');
      }
    }

    const data: any = { ...updateDiscountDto };
    if (updateDiscountDto.type) data.type = updateDiscountDto.type as DiscountType;
    if (updateDiscountDto.scope) data.scope = updateDiscountDto.scope as DiscountScope;

    const updated = await this.prisma.discount.update({ where: { id }, data });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      resource: 'DISCOUNTS',
      resourceId: updated.id,
      oldValues: discount,
      newValues: updated,
      ipAddress: '0.0.0.0',
    });

    return updated;
  }

  async remove(tenantId: string, id: string, userId: string) {
    const discount = await this.findOne(tenantId, id);
    await this.prisma.discount.delete({ where: { id } });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'DELETE',
      resource: 'DISCOUNTS',
      resourceId: discount.id,
      oldValues: discount,
      ipAddress: '0.0.0.0',
    });

    return { message: 'Discount deleted successfully' };
  }

  async calculateDiscounts(tenantId: string, applyDiscountDto: ApplyDiscountDto) {
    const { items, voucherCode, customerId } = applyDiscountDto;
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const where: Prisma.DiscountWhereInput = {
      tenantId,
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };

    if (voucherCode) {
      where.code = voucherCode;
    } else {
      where.code = null;
    }

    const discounts = await this.prisma.discount.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { value: 'desc' }],
    });

    const applicableDiscounts = discounts.filter((discount) => {
      if (discount.daysOfWeek && discount.daysOfWeek.length > 0) {
        if (!discount.daysOfWeek.includes(currentDay)) return false;
      }
      if (discount.startTime && currentTime < discount.startTime) return false;
      if (discount.endTime && currentTime > discount.endTime) return false;
      return true;
    });

    const appliedDiscounts: ApplicableDiscount[] = [];
    const totalCartValue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    for (const discount of applicableDiscounts) {
      if (discount.minPurchase && totalCartValue < discount.minPurchase) continue;
      if (discount.maxUsage && discount.maxUsage > 0 && discount.currentUsage >= discount.maxUsage) continue;

      if (customerId && discount.maxUsagePerCustomer) {
        const customerUsageCount = await this.prisma.discountUsage.count({
          where: { discountId: discount.id, customerId },
        });
        if (customerUsageCount >= discount.maxUsagePerCustomer) continue;
      }

      const applicableItems = this.filterApplicableItems(
        items,
        discount.scope,
        discount.productIds || [],
        discount.categoryIds || [],
      );

      if (applicableItems.length === 0) continue;

      const discountAmount = this.calculateDiscountAmount(discount, applicableItems);

      if (discountAmount > 0) {
        appliedDiscounts.push({
          discountId: discount.id,
          name: discount.name,
          type: discount.type,
          amount: discountAmount,
          applicableItems,
        });
        if (!discount.isCombinable) break;
      }
    }

    const totalDiscount = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);

    return {
      appliedDiscounts,
      totalDiscount,
      finalAmount: Math.max(0, totalCartValue - totalDiscount),
    };
  }

  async recordUsage(
    tenantId: string,
    discountId: string,
    transactionId: string | null,
    outletId: string,
    customerId: string | null,
    discountAmount: number,
  ) {
    const discount = await this.prisma.discount.findFirst({
      where: { id: discountId, tenantId },
    });
    if (!discount) throw new NotFoundException('Discount not found');

    if (discount.maxUsage && discount.maxUsage > 0 && discount.currentUsage >= discount.maxUsage) {
      throw new BadRequestException('Discount usage limit reached');
    }

    await this.prisma.discountUsage.create({
      data: { discountId, transactionId, customerId, outletId, discountAmount },
    });

    await this.prisma.discount.update({
      where: { id: discountId },
      data: { currentUsage: { increment: 1 } },
    });

    return { success: true };
  }

  async getUsageStats(tenantId: string, discountId: string) {
    const discount = await this.findOne(tenantId, discountId);
    const usages = await this.prisma.discountUsage.findMany({ where: { discountId } });
    const totalUsage = usages.length;
    const totalAmountGiven = usages.reduce((sum, usage) => sum + usage.discountAmount, 0);

    return {
      discount: { id: discount.id, name: discount.name, type: discount.type },
      stats: {
        totalUsage,
        totalAmountGiven,
        averagePerUse: totalUsage > 0 ? totalAmountGiven / totalUsage : 0,
        currentUsage: discount.currentUsage,
        maxUsage: discount.maxUsage,
        remainingUsage: discount.maxUsage && discount.maxUsage > 0 ? discount.maxUsage - discount.currentUsage : null,
      },
    };
  }

  private validateDiscountConfig(dto: Partial<CreateDiscountDto>) {
    if (dto.type === 'PERCENTAGE' && dto.value) {
      if (dto.value < 0 || dto.value > 10000) {
        throw new BadRequestException('Percentage discount must be between 0 and 100%');
      }
    }
    if (dto.type === 'BUY_X_GET_Y') {
      if (!dto.buyQuantity || dto.buyQuantity <= 0) {
        throw new BadRequestException('Buy quantity must be greater than 0');
      }
      if (!dto.getQuantity || dto.getQuantity <= 0) {
        throw new BadRequestException('Get quantity must be greater than 0');
      }
    }
    if (dto.scope === 'PRODUCT' && (!dto.productIds || dto.productIds.length === 0)) {
      throw new BadRequestException('Product IDs required for product-scoped discount');
    }
    if (dto.scope === 'CATEGORY' && (!dto.categoryIds || dto.categoryIds.length === 0)) {
      throw new BadRequestException('Category IDs required for category-scoped discount');
    }
  }

  private calculateDiscountAmount(discount: any, items: CartItem[]): number {
    switch (discount.type) {
      case 'PERCENTAGE': return this.calculatePercentageDiscount(discount, items);
      case 'FIXED_AMOUNT': return this.calculateFixedDiscount(discount, items);
      case 'BUY_X_GET_Y': return this.calculateBuyXGetYDiscount(discount, items);
      case 'BUNDLE': return this.calculateFixedDiscount(discount, items);
      default: return 0;
    }
  }

  private calculatePercentageDiscount(discount: any, items: CartItem[]): number {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = Math.floor((subtotal * discount.value) / 10000);
    if (discount.maxAmount && discountAmount > discount.maxAmount) {
      discountAmount = discount.maxAmount;
    }
    return discountAmount;
  }

  private calculateFixedDiscount(discount: any, items: CartItem[]): number {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return Math.min(discount.value, subtotal);
  }

  private calculateBuyXGetYDiscount(discount: any, items: CartItem[]): number {
    if (!discount.buyQuantity || !discount.getQuantity) return 0;
    const sortedItems = [...items].sort((a, b) => a.price - b.price);
    const totalQuantity = sortedItems.reduce((sum, item) => sum + item.quantity, 0);
    const sets = Math.floor(totalQuantity / discount.buyQuantity);
    const freeItems = sets * discount.getQuantity;
    let remainingFreeItems = freeItems;
    let discountAmount = 0;
    for (const item of sortedItems) {
      if (remainingFreeItems <= 0) break;
      const itemsToDiscount = Math.min(item.quantity, remainingFreeItems);
      discountAmount += itemsToDiscount * item.price;
      remainingFreeItems -= itemsToDiscount;
    }
    return discountAmount;
  }

  private filterApplicableItems(
    items: CartItem[],
    scope: string,
    productIds: string[],
    categoryIds: string[],
  ): CartItem[] {
    switch (scope) {
      case 'TRANSACTION': return items;
      case 'PRODUCT': return items.filter((item) => productIds.includes(item.productId));
      case 'CATEGORY': return items.filter((item) => item.categoryId && categoryIds.includes(item.categoryId));
      default: return [];
    }
  }
}
