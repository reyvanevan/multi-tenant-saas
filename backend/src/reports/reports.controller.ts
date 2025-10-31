import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import {
  GetReportQueryDto,
  EndOfDayReportQueryDto,
  ProductPerformanceQueryDto,
  CashierPerformanceQueryDto,
} from './dto';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ==================== SALES REPORTS ====================

  @Get('sales')
  @RequirePermissions('reports.sales.view')
  @ApiOperation({ summary: 'Get sales report' })
  async getSalesReport(
    @TenantId() tenantId: string,
    @Query() query: GetReportQueryDto,
  ) {
    return this.reportsService.getSalesReport(tenantId, query);
  }

  // ==================== END OF DAY ====================

  @Get('end-of-day/:outletId')
  @RequirePermissions('reports.end_of_day.view')
  @ApiOperation({ summary: 'Get end-of-day report for shift close' })
  async getEndOfDayReport(
    @TenantId() tenantId: string,
    @Param('outletId') outletId: string,
    @Query() query: EndOfDayReportQueryDto,
  ) {
    return this.reportsService.getEndOfDayReport(tenantId, outletId, query);
  }

  // ==================== PRODUCT PERFORMANCE ====================

  @Get('products/performance')
  @RequirePermissions('reports.products.view')
  @ApiOperation({ summary: 'Get product performance analysis' })
  async getProductPerformance(
    @TenantId() tenantId: string,
    @Query() query: ProductPerformanceQueryDto,
  ) {
    return this.reportsService.getProductPerformance(tenantId, query);
  }

  // ==================== CASHIER PERFORMANCE ====================

  @Get('cashiers/performance')
  @RequirePermissions('reports.cashiers.view')
  @ApiOperation({ summary: 'Get cashier performance tracking' })
  async getCashierPerformance(
    @TenantId() tenantId: string,
    @Query() query: CashierPerformanceQueryDto,
  ) {
    return this.reportsService.getCashierPerformance(tenantId, query);
  }

  // ==================== INVENTORY VALUATION ====================

  @Get('inventory/valuation')
  @RequirePermissions('reports.inventory.view')
  @ApiOperation({ summary: 'Get inventory valuation report' })
  async getInventoryValuation(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.reportsService.getInventoryValuation(tenantId, outletId);
  }

  // ==================== PROFIT MARGIN ====================

  @Get('profit-margin')
  @RequirePermissions('reports.profit.view')
  @ApiOperation({ summary: 'Get profit margin analysis' })
  async getProfitMarginAnalysis(
    @TenantId() tenantId: string,
    @Query() query: GetReportQueryDto,
  ) {
    return this.reportsService.getProfitMarginAnalysis(tenantId, query);
  }
}
