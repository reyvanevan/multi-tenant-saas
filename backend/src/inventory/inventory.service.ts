import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { ProductsService } from '../products/products.service';
import {
  CreateStockMovementDto,
  StockMovementQueryDto,
  CreateStockAdjustmentDto,
  UpdateStockAdjustmentDto,
  ApproveStockAdjustmentDto,
  CreateStockTransferDto,
  UpdateStockTransferDto,
  ProcessStockTransferDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  UpdateWarehouseStockDto,
} from './dto';
import { StockMovementType, AdjustmentStatus, TransferStatus } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly products: ProductsService,
  ) {}

  // ============================================================================
  // STOCK MOVEMENTS
  // ============================================================================

  async recordStockMovement(
    tenantId: string,
    outletId: string,
    dto: CreateStockMovementDto,
  ) {
    // Get product
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, outletId, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const stockBefore = product.currentStock;
    const stockAfter = stockBefore + dto.quantity;

    if (stockAfter < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    // Create movement record
    const movement = await this.prisma.stockMovement.create({
      data: {
        tenantId,
        outletId,
        productId: dto.productId,
        type: dto.type,
        quantity: dto.quantity,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        stockBefore,
        stockAfter,
        notes: dto.notes,
      },
      include: { product: true },
    });

    // Update product stock
    await this.prisma.product.update({
      where: { id: dto.productId },
      data: { currentStock: stockAfter },
    });

    return {
      message: 'Stock movement recorded successfully',
      movement,
      stockBefore,
      stockAfter,
    };
  }

  async getStockMovements(
    tenantId: string,
    outletId: string,
    query: StockMovementQueryDto,
  ) {
    const where: any = { tenantId, outletId };

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const movements = await this.prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      tenantId,
      outletId,
      count: movements.length,
      movements,
    };
  }

  async getStockLevel(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId, deletedAt: null },
      include: {
        outlet: { select: { id: true, name: true, code: true } },
        warehouseStock: {
          include: { warehouse: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const totalWarehouseStock = product.warehouseStock.reduce(
      (sum, ws) => sum + ws.available,
      0,
    );

    return {
      productId,
      productName: product.name,
      sku: product.sku,
      outletStock: product.currentStock,
      warehouseStock: totalWarehouseStock,
      totalStock: product.currentStock + totalWarehouseStock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      isLowStock: product.currentStock <= product.minStock,
      warehouseDetails: product.warehouseStock,
    };
  }

  // ============================================================================
  // STOCK ADJUSTMENTS
  // ============================================================================

  async createStockAdjustment(
    tenantId: string,
    userId: string,
    outletId: string,
    dto: CreateStockAdjustmentDto,
  ) {
    // Generate adjustment number
    const count = await this.prisma.stockAdjustment.count({ where: { tenantId } });
    const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Create adjustment with items
    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        tenantId,
        outletId,
        adjustmentNumber,
        reason: dto.reason,
        notes: dto.notes,
        status: AdjustmentStatus.PENDING,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            type: item.type,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Audit log
    await this.auditLogs.logCreate(
      tenantId,
      userId,
      'stock_adjustments',
      adjustment.id,
      { adjustmentNumber, reason: dto.reason, itemCount: dto.items.length },
    );

    return {
      message: 'Stock adjustment created successfully',
      adjustment,
    };
  }

  async getStockAdjustments(
    tenantId: string,
    outletId?: string,
    status?: AdjustmentStatus,
  ) {
    const where: any = { tenantId };

    if (outletId) {
      where.outletId = outletId;
    }

    if (status) {
      where.status = status;
    }

    const adjustments = await this.prisma.stockAdjustment.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      tenantId,
      count: adjustments.length,
      adjustments,
    };
  }

  async getStockAdjustment(tenantId: string, adjustmentId: string) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id: adjustmentId, tenantId },
      include: {
        items: true,
      },
    });

    if (!adjustment) {
      throw new NotFoundException('Stock adjustment not found');
    }

    return { adjustment };
  }

  async approveStockAdjustment(
    tenantId: string,
    userId: string,
    adjustmentId: string,
    dto: ApproveStockAdjustmentDto,
  ) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id: adjustmentId, tenantId },
      include: { items: true },
    });

    if (!adjustment) {
      throw new NotFoundException('Stock adjustment not found');
    }

    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new BadRequestException('Adjustment already processed');
    }

    if (dto.approved) {
      // Apply adjustments
      for (const item of adjustment.items) {
        await this.recordStockMovement(tenantId, adjustment.outletId, {
          productId: item.productId,
          type: item.type,
          quantity: item.quantity,
          referenceType: 'adjustment',
          referenceId: adjustmentId,
          notes: item.notes || dto.notes,
        });
      }

      // Update status
      await this.prisma.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: AdjustmentStatus.APPROVED,
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });

      // Audit log
      await this.auditLogs.logUpdate(
        tenantId,
        userId,
        'stock_adjustments',
        adjustmentId,
        { status: AdjustmentStatus.PENDING },
        { status: AdjustmentStatus.APPROVED, notes: dto.notes },
      );

      return {
        message: 'Stock adjustment approved and applied successfully',
        adjustment: await this.getStockAdjustment(tenantId, adjustmentId),
      };
    } else {
      // Reject
      await this.prisma.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: AdjustmentStatus.REJECTED,
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });

      // Audit log
      await this.auditLogs.logUpdate(
        tenantId,
        userId,
        'stock_adjustments',
        adjustmentId,
        { status: AdjustmentStatus.PENDING },
        { status: AdjustmentStatus.REJECTED, notes: dto.notes },
      );

      return {
        message: 'Stock adjustment rejected',
        adjustment: await this.getStockAdjustment(tenantId, adjustmentId),
      };
    }
  }

  // ============================================================================
  // STOCK TRANSFERS
  // ============================================================================

  async createStockTransfer(
    tenantId: string,
    userId: string,
    dto: CreateStockTransferDto,
  ) {
    // Verify outlets
    const [fromOutlet, toOutlet] = await Promise.all([
      this.prisma.outlet.findFirst({ where: { id: dto.fromOutletId, tenantId } }),
      this.prisma.outlet.findFirst({ where: { id: dto.toOutletId, tenantId } }),
    ]);

    if (!fromOutlet || !toOutlet) {
      throw new BadRequestException('Invalid outlet(s)');
    }

    if (dto.fromOutletId === dto.toOutletId) {
      throw new BadRequestException('Cannot transfer to same outlet');
    }

    // Check stock availability
    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, outletId: dto.fromOutletId, tenantId },
      });

      if (!product || product.currentStock < item.quantityRequested) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.productId}`,
        );
      }
    }

    // Generate transfer number
    const count = await this.prisma.stockTransfer.count({ where: { tenantId } });
    const transferNumber = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    // Create transfer
    const transfer = await this.prisma.stockTransfer.create({
      data: {
        tenantId,
        transferNumber,
        fromOutletId: dto.fromOutletId,
        toOutletId: dto.toOutletId,
        status: TransferStatus.PENDING,
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantityRequested: item.quantityRequested,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Audit log
    await this.auditLogs.logCreate(
      tenantId,
      userId,
      'stock_transfers',
      transfer.id,
      {
        transferNumber,
        from: fromOutlet.name,
        to: toOutlet.name,
        itemCount: dto.items.length,
      },
    );

    return {
      message: 'Stock transfer created successfully',
      transfer,
    };
  }

  async getStockTransfers(
    tenantId: string,
    outletId?: string,
    status?: TransferStatus,
  ) {
    const where: any = { tenantId };

    if (outletId) {
      where.OR = [{ fromOutletId: outletId }, { toOutletId: outletId }];
    }

    if (status) {
      where.status = status;
    }

    const transfers = await this.prisma.stockTransfer.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      tenantId,
      count: transfers.length,
      transfers,
    };
  }

  async processStockTransfer(
    tenantId: string,
    userId: string,
    transferId: string,
    dto: any, // ProcessStockTransferDto
  ) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id: transferId, tenantId },
      include: { items: true },
    });

    if (!transfer) {
      throw new NotFoundException('Stock transfer not found');
    }

    switch (dto.action) {
      case 'APPROVE':
        if (transfer.status !== TransferStatus.PENDING) {
          throw new BadRequestException('Transfer must be PENDING to approve');
        }

        await this.prisma.stockTransfer.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.APPROVED,
            approvedBy: userId,
            approvedAt: new Date(),
          },
        });

        await this.auditLogs.logUpdate(
          tenantId,
          userId,
          'stock_transfers',
          transferId,
          { status: TransferStatus.PENDING },
          { status: TransferStatus.APPROVED, notes: dto.notes },
        );

        return { message: 'Transfer approved successfully' };

      case 'SHIP':
        if (transfer.status !== TransferStatus.APPROVED) {
          throw new BadRequestException('Transfer must be APPROVED to ship');
        }

        // Deduct stock from source
        for (const item of transfer.items) {
          const shipped = dto.items?.find((i: any) => i.productId === item.productId);
          const quantity = shipped?.quantity || item.quantityRequested;

          await this.recordStockMovement(tenantId, transfer.fromOutletId, {
            productId: item.productId,
            type: StockMovementType.TRANSFER_OUT,
            quantity: -quantity,
            referenceType: 'transfer',
            referenceId: transferId,
            notes: `Transfer to ${transfer.toOutletId}`,
          });

          // Update item
          await this.prisma.stockTransferItem.update({
            where: { id: item.id },
            data: { quantityShipped: quantity },
          });
        }

        await this.prisma.stockTransfer.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.SHIPPED,
            shippedDate: new Date(),
          },
        });

        return { message: 'Transfer shipped successfully' };

      case 'RECEIVE':
        if (transfer.status !== TransferStatus.SHIPPED) {
          throw new BadRequestException('Transfer must be SHIPPED to receive');
        }

        // Add stock to destination
        for (const item of transfer.items) {
          const received = dto.items?.find((i: any) => i.productId === item.productId);
          const quantity = received?.quantity || item.quantityShipped || item.quantityRequested;

          await this.recordStockMovement(tenantId, transfer.toOutletId, {
            productId: item.productId,
            type: StockMovementType.TRANSFER_IN,
            quantity: quantity,
            referenceType: 'transfer',
            referenceId: transferId,
            notes: `Transfer from ${transfer.fromOutletId}`,
          });

          // Update item
          await this.prisma.stockTransferItem.update({
            where: { id: item.id },
            data: { quantityReceived: quantity },
          });
        }

        await this.prisma.stockTransfer.update({
          where: { id: transferId },
          data: {
            status: TransferStatus.RECEIVED,
            receivedDate: new Date(),
          },
        });

        return { message: 'Transfer received successfully' };

      case 'CANCEL':
        if (transfer.status === TransferStatus.RECEIVED) {
          throw new BadRequestException('Cannot cancel completed transfer');
        }

        await this.prisma.stockTransfer.update({
          where: { id: transferId },
          data: { status: TransferStatus.CANCELLED },
        });

        return { message: 'Transfer cancelled successfully' };

      default:
        throw new BadRequestException('Invalid action');
    }
  }

  // ============================================================================
  // WAREHOUSES
  // ============================================================================

  async createWarehouse(
    tenantId: string,
    userId: string,
    dto: CreateWarehouseDto,
  ) {
    // Verify outlet
    const outlet = await this.prisma.outlet.findFirst({
      where: { id: dto.outletId, tenantId },
    });

    if (!outlet) {
      throw new BadRequestException('Outlet not found');
    }

    // Check code uniqueness
    const existing = await this.prisma.warehouse.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });

    if (existing) {
      throw new BadRequestException(`Warehouse with code ${dto.code} already exists`);
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        tenantId,
        outletId: dto.outletId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        type: dto.type,
        maxCapacity: dto.maxCapacity,
      },
    });

    // Audit log
    await this.auditLogs.logCreate(
      tenantId,
      userId,
      'warehouses',
      warehouse.id,
      { code: dto.code, name: dto.name },
    );

    return {
      message: 'Warehouse created successfully',
      warehouse,
    };
  }

  async getWarehouses(tenantId: string, outletId?: string) {
    const where: any = { tenantId };

    if (outletId) {
      where.outletId = outletId;
    }

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      include: {
        _count: { select: { stock: true } },
      },
      orderBy: { name: 'asc' },
    });

    return {
      tenantId,
      count: warehouses.length,
      warehouses,
    };
  }

  async getWarehouseStock(tenantId: string, warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, tenantId },
      include: {
        stock: {
          include: {
            product: {
              select: { name: true, sku: true, unit: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }

    return {
      warehouse,
      totalItems: warehouse.stock.length,
      totalQuantity: warehouse.stock.reduce((sum, s) => sum + s.quantity, 0),
      totalAvailable: warehouse.stock.reduce((sum, s) => sum + s.available, 0),
    };
  }
}
