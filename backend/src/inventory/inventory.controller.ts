import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateStockMovementDto,
  StockMovementQueryDto,
  CreateStockAdjustmentDto,
  ApproveStockAdjustmentDto,
  CreateStockTransferDto,
  ProcessStockTransferDto,
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from './dto';
import { AdjustmentStatus, TransferStatus } from '@prisma/client';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============================================================================
  // STOCK MOVEMENTS
  // ============================================================================

  @Post('movements')
  @RequirePermissions('inventory.create.outlet')
  @ApiOperation({ summary: 'Record stock movement' })
  @ApiResponse({ status: 201, description: 'Movement recorded successfully' })
  recordMovement(
    @TenantId() tenantId: string,
    @Query('outletId', ParseUUIDPipe) outletId: string,
    @Body() dto: CreateStockMovementDto,
  ) {
    return this.inventoryService.recordStockMovement(tenantId, outletId, dto);
  }

  @Get('movements')
  @RequirePermissions('inventory.read.outlet')
  @ApiOperation({ summary: 'Get stock movements' })
  @ApiQuery({ name: 'outletId', required: true })
  @ApiResponse({ status: 200, description: 'Movements retrieved successfully' })
  getMovements(
    @TenantId() tenantId: string,
    @Query('outletId', ParseUUIDPipe) outletId: string,
    @Query() query: StockMovementQueryDto,
  ) {
    return this.inventoryService.getStockMovements(tenantId, outletId, query);
  }

  @Get('stock-level/:productId')
  @RequirePermissions('inventory.read.outlet')
  @ApiOperation({ summary: 'Get product stock level across all locations' })
  @ApiResponse({ status: 200, description: 'Stock level retrieved successfully' })
  getStockLevel(
    @TenantId() tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.inventoryService.getStockLevel(tenantId, productId);
  }

  // ============================================================================
  // STOCK ADJUSTMENTS
  // ============================================================================

  @Post('adjustments')
  @RequirePermissions('inventory.create.outlet')
  @ApiOperation({ summary: 'Create stock adjustment' })
  @ApiResponse({ status: 201, description: 'Adjustment created successfully' })
  createAdjustment(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Query('outletId', ParseUUIDPipe) outletId: string,
    @Body() dto: CreateStockAdjustmentDto,
  ) {
    return this.inventoryService.createStockAdjustment(
      tenantId,
      req.user.userId,
      outletId,
      dto,
    );
  }

  @Get('adjustments')
  @RequirePermissions('inventory.read.outlet')
  @ApiOperation({ summary: 'Get stock adjustments' })
  @ApiQuery({ name: 'outletId', required: false })
  @ApiQuery({ name: 'status', enum: AdjustmentStatus, required: false })
  @ApiResponse({ status: 200, description: 'Adjustments retrieved successfully' })
  getAdjustments(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
    @Query('status', new ParseEnumPipe(AdjustmentStatus, { optional: true }))
    status?: AdjustmentStatus,
  ) {
    return this.inventoryService.getStockAdjustments(tenantId, outletId, status);
  }

  @Get('adjustments/:adjustmentId')
  @RequirePermissions('inventory.read.outlet')
  @ApiOperation({ summary: 'Get single stock adjustment' })
  @ApiResponse({ status: 200, description: 'Adjustment retrieved successfully' })
  getAdjustment(
    @TenantId() tenantId: string,
    @Param('adjustmentId', ParseUUIDPipe) adjustmentId: string,
  ) {
    return this.inventoryService.getStockAdjustment(tenantId, adjustmentId);
  }

  @Patch('adjustments/:adjustmentId/approve')
  @RequirePermissions('inventory.approve.outlet')
  @ApiOperation({ summary: 'Approve or reject stock adjustment' })
  @ApiResponse({ status: 200, description: 'Adjustment processed successfully' })
  approveAdjustment(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('adjustmentId', ParseUUIDPipe) adjustmentId: string,
    @Body() dto: ApproveStockAdjustmentDto,
  ) {
    return this.inventoryService.approveStockAdjustment(
      tenantId,
      req.user.userId,
      adjustmentId,
      dto,
    );
  }

  // ============================================================================
  // STOCK TRANSFERS
  // ============================================================================

  @Post('transfers')
  @RequirePermissions('inventory.create.outlet')
  @ApiOperation({ summary: 'Create stock transfer' })
  @ApiResponse({ status: 201, description: 'Transfer created successfully' })
  createTransfer(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Body() dto: CreateStockTransferDto,
  ) {
    return this.inventoryService.createStockTransfer(tenantId, req.user.userId, dto);
  }

  @Get('transfers')
  @RequirePermissions('inventory.read.outlet')
  @ApiOperation({ summary: 'Get stock transfers' })
  @ApiQuery({ name: 'outletId', required: false })
  @ApiQuery({ name: 'status', enum: TransferStatus, required: false })
  @ApiResponse({ status: 200, description: 'Transfers retrieved successfully' })
  getTransfers(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
    @Query('status', new ParseEnumPipe(TransferStatus, { optional: true }))
    status?: TransferStatus,
  ) {
    return this.inventoryService.getStockTransfers(tenantId, outletId, status);
  }

  @Patch('transfers/:transferId/process')
  @RequirePermissions('inventory.update.outlet')
  @ApiOperation({ summary: 'Process stock transfer (approve/ship/receive/cancel)' })
  @ApiResponse({ status: 200, description: 'Transfer processed successfully' })
  processTransfer(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('transferId', ParseUUIDPipe) transferId: string,
    @Body() dto: ProcessStockTransferDto,
  ) {
    return this.inventoryService.processStockTransfer(
      tenantId,
      req.user.userId,
      transferId,
      dto,
    );
  }

  // ============================================================================
  // WAREHOUSES
  // ============================================================================

  @Post('warehouses')
  @RequirePermissions('inventory.create.tenant')
  @ApiOperation({ summary: 'Create warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created successfully' })
  createWarehouse(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.inventoryService.createWarehouse(tenantId, req.user.userId, dto);
  }

  @Get('warehouses')
  @RequirePermissions('inventory.read.tenant')
  @ApiOperation({ summary: 'Get warehouses' })
  @ApiQuery({ name: 'outletId', required: false })
  @ApiResponse({ status: 200, description: 'Warehouses retrieved successfully' })
  getWarehouses(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.inventoryService.getWarehouses(tenantId, outletId);
  }

  @Get('warehouses/:warehouseId/stock')
  @RequirePermissions('inventory.read.tenant')
  @ApiOperation({ summary: 'Get warehouse stock' })
  @ApiResponse({ status: 200, description: 'Warehouse stock retrieved successfully' })
  getWarehouseStock(
    @TenantId() tenantId: string,
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
  ) {
    return this.inventoryService.getWarehouseStock(tenantId, warehouseId);
  }
}
