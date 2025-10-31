import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CreateGoodsReceivingDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ==================== SUPPLIERS ====================

  async createSupplier(tenantId: string, dto: CreateSupplierDto, userId: string) {
    // Check if supplier code already exists for this tenant
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: { tenantId, code: dto.code },
    });

    if (existingSupplier) {
      throw new ConflictException('Supplier code already exists');
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        ...dto,
        tenantId,
        paymentTerms: dto.paymentTerms || 'NET_30',
      },
    });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'CREATE',
      resource: 'SUPPLIERS',
      resourceId: supplier.id,
      newValues: supplier,
      ipAddress: '0.0.0.0',
    });

    return supplier;
  }

  async findAllSuppliers(
    tenantId: string,
    filters?: {
      isActive?: boolean;
      search?: string;
    },
  ) {
    const where: Prisma.SupplierWhereInput = { tenantId, deletedAt: null };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { contactPerson: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            supplierPayments: true,
          },
        },
      },
    });
  }

  async findOneSupplier(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            total: true,
            status: true,
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
            supplierPayments: true,
          },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async updateSupplier(
    tenantId: string,
    id: string,
    dto: UpdateSupplierDto,
    userId: string,
  ) {
    const supplier = await this.findOneSupplier(tenantId, id);

    // Check if code is being changed and if it already exists
    if (dto.code && dto.code !== supplier.code) {
      const existingSupplier = await this.prisma.supplier.findFirst({
        where: { tenantId, code: dto.code, id: { not: id } },
      });

      if (existingSupplier) {
        throw new ConflictException('Supplier code already exists');
      }
    }

    const updated = await this.prisma.supplier.update({
      where: { id },
      data: dto,
    });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      resource: 'SUPPLIERS',
      resourceId: updated.id,
      oldValues: supplier,
      newValues: updated,
      ipAddress: '0.0.0.0',
    });

    return updated;
  }

  async deleteSupplier(tenantId: string, id: string, userId: string) {
    const supplier = await this.findOneSupplier(tenantId, id);

    // Soft delete
    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'DELETE',
      resource: 'SUPPLIERS',
      resourceId: supplier.id,
      oldValues: supplier,
      ipAddress: '0.0.0.0',
    });

    return { message: 'Supplier deleted successfully' };
  }

  async getSupplierPerformance(tenantId: string, id: string) {
    const supplier = await this.findOneSupplier(tenantId, id);

    // Get all completed purchase orders
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        tenantId,
        supplierId: id,
        status: 'RECEIVED',
      },
      include: {
        receivings: {
          include: {
            items: true,
          },
        },
      },
    });

    // Calculate on-time delivery rate
    let onTimeDeliveries = 0;
    let totalDeliveries = 0;

    for (const po of purchaseOrders) {
      if (po.receivedDate && po.expectedDate) {
        totalDeliveries++;
        if (po.receivedDate <= po.expectedDate) {
          onTimeDeliveries++;
        }
      }
    }

    const onTimeRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

    // Calculate quality score (accepted items / total items)
    let acceptedItems = 0;
    let totalItems = 0;

    for (const po of purchaseOrders) {
      for (const receiving of po.receivings) {
        for (const item of receiving.items) {
          totalItems++;
          if (item.qualityStatus === 'ACCEPTED') {
            acceptedItems++;
          }
        }
      }
    }

    const qualityScore = totalItems > 0 ? (acceptedItems / totalItems) * 100 : 0;

    return {
      supplier: {
        id: supplier.id,
        name: supplier.name,
        rating: supplier.rating,
      },
      performance: {
        totalPurchaseOrders: purchaseOrders.length,
        onTimeDeliveryRate: Math.round(onTimeRate * 10) / 10,
        qualityScore: Math.round(qualityScore * 10) / 10,
        totalSpent: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
      },
    };
  }

  // ==================== PURCHASE ORDERS ====================

  async createPurchaseOrder(tenantId: string, dto: CreatePurchaseOrderDto, userId: string) {
    // Verify supplier exists
    await this.findOneSupplier(tenantId, dto.supplierId);

    // Calculate totals
    let subtotal = 0;
    const items: any[] = [];

    for (const item of dto.items) {
      // Get product for snapshot
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, tenantId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const itemSubtotal = item.unitPrice * item.quantityOrdered - (item.discount || 0) + (item.tax || 0);
      subtotal += itemSubtotal;

      items.push({
        productId: item.productId,
        productName: product.name,
        productSku: product.sku,
        quantityOrdered: item.quantityOrdered,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 0,
        subtotal: itemSubtotal,
        notes: item.notes,
      });
    }

    const total = subtotal - (dto.discount || 0) + (dto.shippingCost || 0);

    // Generate order number
    const orderNumber = await this.generatePONumber(tenantId);

    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        orderNumber,
        supplierId: dto.supplierId,
        outletId: dto.outletId,
        warehouseId: dto.warehouseId,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        subtotal,
        discount: dto.discount || 0,
        shippingCost: dto.shippingCost || 0,
        total,
        notes: dto.notes,
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'CREATE',
      resource: 'PURCHASE_ORDERS',
      resourceId: purchaseOrder.id,
      newValues: purchaseOrder,
      ipAddress: '0.0.0.0',
    });

    return purchaseOrder;
  }

  async findAllPurchaseOrders(
    tenantId: string,
    filters?: {
      supplierId?: string;
      outletId?: string;
      status?: string;
    },
  ) {
    const where: Prisma.PurchaseOrderWhereInput = { tenantId };

    if (filters?.supplierId) where.supplierId = filters.supplierId;
    if (filters?.outletId) where.outletId = filters.outletId;
    if (filters?.status) where.status = filters.status as any;

    return this.prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            items: true,
            receivings: true,
          },
        },
      },
    });
  }

  async findOnePurchaseOrder(tenantId: string, id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        items: true,
        receivings: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    return purchaseOrder;
  }

  async updatePurchaseOrder(
    tenantId: string,
    id: string,
    dto: UpdatePurchaseOrderDto,
    userId: string,
  ) {
    const purchaseOrder = await this.findOnePurchaseOrder(tenantId, id);

    // Only allow updates if status is DRAFT or SUBMITTED
    if (!['DRAFT', 'SUBMITTED'].includes(purchaseOrder.status)) {
      throw new BadRequestException(
        'Cannot update purchase order in current status',
      );
    }

    const updateData: any = {
      status: dto.status,
      approvedBy: dto.approvedBy,
      notes: dto.notes,
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      approvedAt: dto.status === 'APPROVED' ? new Date() : undefined,
    };

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        items: true,
      },
    });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'UPDATE',
      resource: 'PURCHASE_ORDERS',
      resourceId: updated.id,
      oldValues: purchaseOrder,
      newValues: updated,
      ipAddress: '0.0.0.0',
    });

    return updated;
  }

  async approvePurchaseOrder(tenantId: string, id: string, userId: string) {
    return this.updatePurchaseOrder(
      tenantId,
      id,
      { status: 'APPROVED', approvedBy: userId },
      userId,
    );
  }

  // ==================== GOODS RECEIVING ====================

  async createGoodsReceiving(tenantId: string, dto: CreateGoodsReceivingDto, userId: string) {
    const purchaseOrder = await this.findOnePurchaseOrder(tenantId, dto.purchaseOrderId);

    // Verify PO is approved
    if (purchaseOrder.status !== 'APPROVED' && purchaseOrder.status !== 'PARTIAL_RECEIVED') {
      throw new BadRequestException('Purchase order must be approved before receiving');
    }

    // Calculate receiving status
    let allItemsReceived = true;
    const receivingItems: any[] = [];

    for (const item of dto.items) {
      const poItem = purchaseOrder.items.find((i) => i.productId === item.productId);
      if (!poItem) {
        throw new NotFoundException(`Product ${item.productId} not in purchase order`);
      }

      receivingItems.push({
        productId: item.productId,
        quantityExpected: item.quantityExpected,
        quantityReceived: item.quantityReceived,
        qualityStatus: item.qualityStatus || 'ACCEPTED',
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        notes: item.notes,
      });

      // Check if item is fully received
      const totalReceived = poItem.quantityReceived + item.quantityReceived;
      if (totalReceived < poItem.quantityOrdered) {
        allItemsReceived = false;
      }

      // Update PO item quantities
      await this.prisma.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: {
          quantityReceived: totalReceived,
        },
      });

      // Create stock movement if quality is ACCEPTED
      if (item.qualityStatus === 'ACCEPTED' || !item.qualityStatus) {
        // Get current stock
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { currentStock: true },
        });

        const stockBefore = product?.currentStock || 0;
        const stockAfter = stockBefore + item.quantityReceived;

        await this.prisma.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            outletId: dto.outletId,
            type: 'PURCHASE',
            quantity: item.quantityReceived,
            stockBefore,
            stockAfter,
            referenceType: 'GOODS_RECEIVING',
            notes: `GRN from PO ${purchaseOrder.orderNumber}`,
          },
        });

        // Update product stock
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantityReceived,
            },
          },
        });
      }
    }

    const receivingStatus = allItemsReceived ? 'COMPLETED' : 'PARTIAL';

    // Generate receiving number
    const receivingNumber = await this.generateGRNNumber(tenantId);

    const goodsReceiving = await this.prisma.goodsReceiving.create({
      data: {
        tenantId,
        receivingNumber,
        purchaseOrderId: dto.purchaseOrderId,
        outletId: dto.outletId,
        warehouseId: dto.warehouseId,
        receivedBy: dto.receivedBy,
        status: receivingStatus,
        notes: dto.notes,
        discrepancyNotes: dto.discrepancyNotes,
        items: {
          create: receivingItems,
        },
      },
      include: {
        items: true,
      },
    });

    // Update PO status
    const newPOStatus = allItemsReceived ? 'RECEIVED' : 'PARTIAL_RECEIVED';
    await this.prisma.purchaseOrder.update({
      where: { id: dto.purchaseOrderId },
      data: {
        status: newPOStatus,
        receivedDate: allItemsReceived ? new Date() : null,
      },
    });

    await this.auditLogsService.log({
      tenantId,
      userId,
      action: 'CREATE',
      resource: 'GOODS_RECEIVING',
      resourceId: goodsReceiving.id,
      newValues: goodsReceiving,
      ipAddress: '0.0.0.0',
    });

    return goodsReceiving;
  }

  // ==================== HELPERS ====================

  private async generatePONumber(tenantId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    // Get last PO number for this month
    const lastPO = await this.prisma.purchaseOrder.findFirst({
      where: {
        tenantId,
        orderNumber: {
          startsWith: `PO-${year}${month}`,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastPO) {
      const lastSequence = parseInt(lastPO.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `PO-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  }

  private async generateGRNNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    // Get last GRN number for this month
    const lastGRN = await this.prisma.goodsReceiving.findFirst({
      where: {
        tenantId,
        receivingNumber: {
          startsWith: `GRN-${year}${month}`,
        },
      },
      orderBy: {
        receivingNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastGRN) {
      const lastSequence = parseInt(lastGRN.receivingNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `GRN-${year}${month}-${sequence.toString().padStart(4, '0')}`;
  }
}
