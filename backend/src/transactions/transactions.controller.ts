import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  CreateRefundDto,
  OpenShiftDto,
  CloseShiftDto,
  CreateSplitPaymentDto,
} from './dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @RequirePermissions('transactions.create.outlet')
  @ApiOperation({ summary: 'Create a new transaction (POS sale)' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or insufficient stock',
  })
  create(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    const userId = req.user.userId;
    return this.transactionsService.create(
      tenantId,
      userId,
      createTransactionDto,
    );
  }

  @Get()
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Get all transactions with filters' })
  @ApiQuery({
    name: 'outletId',
    required: false,
    description: 'Filter by outlet ID',
  })
  @ApiQuery({
    name: 'shiftId',
    required: false,
    description: 'Filter by shift ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  findAll(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
    @Query('shiftId') shiftId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.transactionsService.findAll(
      tenantId,
      outletId,
      shiftId,
      start,
      end,
    );
  }

  @Get('stats')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiQuery({
    name: 'outletId',
    required: false,
    description: 'Filter by outlet ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  getStats(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.transactionsService.getStats(tenantId, outletId, start, end);
  }

  @Get(':id')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Get a single transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.findOne(tenantId, id);
  }

  @Post('refund')
  @RequirePermissions('transactions.refund.outlet')
  @ApiOperation({ summary: 'Create a refund for a transaction' })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  createRefund(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Body() createRefundDto: CreateRefundDto,
  ) {
    return this.transactionsService.createRefund(
      tenantId,
      req.user.userId,
      createRefundDto,
    );
  }

  // ============================================================================
  // SHIFT MANAGEMENT
  // ============================================================================

  @Post('shifts')
  @RequirePermissions('shifts.create.outlet')
  @ApiOperation({ summary: 'Open a new shift' })
  @ApiResponse({ status: 201, description: 'Shift opened successfully' })
  @ApiResponse({ status: 400, description: 'User already has an open shift' })
  openShift(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Body() dto: OpenShiftDto,
  ) {
    return this.transactionsService.openShift(
      tenantId,
      req.user.userId,
      dto.outletId,
      dto.openingCash,
      dto.openingNotes,
    );
  }

  @Patch('shifts/:id/close')
  @RequirePermissions('shifts.update.outlet')
  @ApiOperation({ summary: 'Close an open shift' })
  @ApiResponse({ status: 200, description: 'Shift closed successfully' })
  @ApiResponse({ status: 404, description: 'Open shift not found' })
  closeShift(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('id', ParseUUIDPipe) shiftId: string,
    @Body() dto: CloseShiftDto,
  ) {
    return this.transactionsService.closeShift(
      tenantId,
      req.user.userId,
      shiftId,
      dto.closingCash,
      dto.closingNotes,
    );
  }

  @Get('shifts/current')
  @RequirePermissions('shifts.read.outlet')
  @ApiOperation({ summary: 'Get current active shift for user' })
  @ApiQuery({ name: 'outletId', required: true })
  @ApiResponse({ status: 200, description: 'Current shift retrieved' })
  getCurrentShift(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Query('outletId') outletId: string,
  ) {
    return this.transactionsService.getCurrentShift(
      tenantId,
      req.user.userId,
      outletId,
    );
  }

  @Get('shifts/history')
  @RequirePermissions('shifts.read.outlet')
  @ApiOperation({ summary: 'Get shift history' })
  @ApiQuery({ name: 'outletId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Shift history retrieved' })
  getShiftHistory(
    @TenantId() tenantId: string,
    @Query('outletId') outletId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.transactionsService.getShiftHistory(
      tenantId,
      outletId,
      userId,
      start,
      end,
    );
  }

  // ============================================================================
  // SPLIT PAYMENTS
  // ============================================================================

  @Post('split-payment')
  @RequirePermissions('transactions.create.outlet')
  @ApiOperation({ summary: 'Create transaction with split payment' })
  @ApiResponse({
    status: 201,
    description: 'Transaction with split payment created',
  })
  @ApiResponse({
    status: 400,
    description: 'Split payment total mismatch',
  })
  createWithSplitPayment(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Body() dto: CreateSplitPaymentDto,
  ) {
    return this.transactionsService.createWithSplitPayment(
      tenantId,
      req.user.userId,
      dto,
    );
  }

  // ============================================================================
  // PRICING HELPERS
  // ============================================================================

  @Post('calculate')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Calculate transaction total before creating' })
  @ApiResponse({ status: 200, description: 'Total calculated' })
  calculateTotal(
    @TenantId() tenantId: string,
    @Body()
    dto: {
      outletId: string;
      items: Array<{ productId: string; quantity: number; discount?: number }>;
      discount?: number;
    },
  ) {
    return this.transactionsService.calculateTransactionTotal(
      tenantId,
      dto.outletId,
      dto.items,
      dto.discount,
    );
  }

  @Get('products/:productId/price')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Get price for product at specific quantity' })
  @ApiQuery({ name: 'quantity', required: true })
  @ApiResponse({ status: 200, description: 'Price retrieved' })
  getProductPrice(
    @TenantId() tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('quantity') quantity: number,
  ) {
    return this.transactionsService.calculatePrice(
      tenantId,
      productId,
      Number(quantity),
    );
  }
}
