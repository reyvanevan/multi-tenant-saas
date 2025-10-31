import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  CreateGoodsReceivingDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions as Permissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  // ==================== SUPPLIERS ====================

  @Post()
  @Permissions('suppliers.create.outlet')
  @ApiOperation({ summary: 'Create new supplier' })
  createSupplier(@Req() req: any, @Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.createSupplier(
      req.user.tenantId,
      createSupplierDto,
      req.user.userId,
    );
  }

  @Get()
  @Permissions('suppliers.read.outlet')
  @ApiOperation({ summary: 'Get all suppliers' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAllSuppliers(
    @Req() req: any,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.suppliersService.findAllSuppliers(req.user.tenantId, {
      isActive: isActive ? isActive === 'true' : undefined,
      search,
    });
  }

  @Get(':id')
  @Permissions('suppliers.read.outlet')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOneSupplier(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.findOneSupplier(req.user.tenantId, id);
  }

  @Patch(':id')
  @Permissions('suppliers.update.outlet')
  @ApiOperation({ summary: 'Update supplier' })
  updateSupplier(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.updateSupplier(
      req.user.tenantId,
      id,
      updateSupplierDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @Permissions('suppliers.delete.outlet')
  @ApiOperation({ summary: 'Delete supplier (soft delete)' })
  deleteSupplier(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.deleteSupplier(req.user.tenantId, id, req.user.userId);
  }

  @Get(':id/performance')
  @Permissions('suppliers.read.outlet')
  @ApiOperation({ summary: 'Get supplier performance metrics' })
  getSupplierPerformance(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.getSupplierPerformance(req.user.tenantId, id);
  }

  // ==================== PURCHASE ORDERS ====================

  @Post('purchase-orders')
  @Permissions('purchase_orders.create.outlet')
  @ApiOperation({ summary: 'Create purchase order' })
  createPurchaseOrder(@Req() req: any, @Body() dto: CreatePurchaseOrderDto) {
    return this.suppliersService.createPurchaseOrder(req.user.tenantId, dto, req.user.userId);
  }

  @Get('purchase-orders')
  @Permissions('purchase_orders.read.outlet')
  @ApiOperation({ summary: 'Get all purchase orders' })
  @ApiQuery({ name: 'supplierId', required: false, type: String })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  findAllPurchaseOrders(
    @Req() req: any,
    @Query('supplierId') supplierId?: string,
    @Query('outletId') outletId?: string,
    @Query('status') status?: string,
  ) {
    return this.suppliersService.findAllPurchaseOrders(req.user.tenantId, {
      supplierId,
      outletId,
      status,
    });
  }

  @Get('purchase-orders/:id')
  @Permissions('purchase_orders.read.outlet')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  findOnePurchaseOrder(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.findOnePurchaseOrder(req.user.tenantId, id);
  }

  @Patch('purchase-orders/:id')
  @Permissions('purchase_orders.update.outlet')
  @ApiOperation({ summary: 'Update purchase order' })
  updatePurchaseOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.suppliersService.updatePurchaseOrder(
      req.user.tenantId,
      id,
      dto,
      req.user.userId,
    );
  }

  @Post('purchase-orders/:id/approve')
  @Permissions('purchase_orders.approve.outlet')
  @ApiOperation({ summary: 'Approve purchase order' })
  approvePurchaseOrder(@Req() req: any, @Param('id') id: string) {
    return this.suppliersService.approvePurchaseOrder(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  // ==================== GOODS RECEIVING ====================

  @Post('goods-receiving')
  @Permissions('goods_receiving.create.outlet')
  @ApiOperation({ summary: 'Create goods receiving (GRN)' })
  createGoodsReceiving(@Req() req: any, @Body() dto: CreateGoodsReceivingDto) {
    return this.suppliersService.createGoodsReceiving(req.user.tenantId, dto, req.user.userId);
  }
}
