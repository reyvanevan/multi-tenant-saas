import {
  Controller,
  Get,
  Post,
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
import { ReceiptsService } from './receipts.service';
import {
  GenerateReceiptDto,
  EmailReceiptDto,
  WhatsAppReceiptDto,
  ReceiptFormat,
} from './dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';

@ApiTags('receipts')
@ApiBearerAuth()
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('generate')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Generate receipt for transaction' })
  @ApiResponse({ status: 200, description: 'Receipt generated successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  generateReceipt(@TenantId() tenantId: string, @Body() dto: GenerateReceiptDto) {
    return this.receiptsService.generateReceipt(
      tenantId,
      dto.transactionId,
      dto.format,
      {
        includeQrCode: dto.includeQrCode,
        customHeader: dto.customHeader,
        customFooter: dto.customFooter,
      },
    );
  }

  @Get(':transactionId')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Get receipt for transaction with default format' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReceiptFormat,
    description: 'Receipt format (default: THERMAL_80MM)',
  })
  @ApiResponse({ status: 200, description: 'Receipt generated' })
  getReceipt(
    @TenantId() tenantId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Query('format') format?: ReceiptFormat,
  ) {
    return this.receiptsService.generateReceipt(
      tenantId,
      transactionId,
      format || ReceiptFormat.THERMAL_80MM,
      { includeQrCode: true },
    );
  }

  @Post('email')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Send receipt via email' })
  @ApiResponse({ status: 200, description: 'Receipt email queued' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  sendEmail(@TenantId() tenantId: string, @Body() dto: EmailReceiptDto) {
    return this.receiptsService.sendReceiptEmail(
      tenantId,
      dto.transactionId,
      dto.email,
      {
        subject: dto.subject,
        message: dto.message,
      },
    );
  }

  @Post('whatsapp')
  @RequireFeature({ feature: 'whatsapp_integration' })
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Send receipt via WhatsApp' })
  @ApiResponse({ status: 200, description: 'Receipt WhatsApp queued' })
  @ApiResponse({ status: 400, description: 'WhatsApp integration not enabled' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  sendWhatsApp(@TenantId() tenantId: string, @Body() dto: WhatsAppReceiptDto) {
    return this.receiptsService.sendReceiptWhatsApp(
      tenantId,
      dto.transactionId,
      dto.phoneNumber,
      {
        message: dto.message,
      },
    );
  }

  @Get(':transactionId/history')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Get receipt generation history' })
  @ApiResponse({ status: 200, description: 'Receipt history retrieved' })
  getHistory(
    @TenantId() tenantId: string,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
  ) {
    return this.receiptsService.getReceiptHistory(tenantId, transactionId);
  }

  @Post(':transactionId/reprint')
  @RequirePermissions('transactions.read.outlet')
  @ApiOperation({ summary: 'Reprint receipt (marked as reprint)' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ReceiptFormat,
  })
  @ApiResponse({ status: 200, description: 'Receipt reprinted' })
  reprintReceipt(
    @TenantId() tenantId: string,
    @Request() req: any,
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Query('format') format?: ReceiptFormat,
  ) {
    return this.receiptsService.reprintReceipt(
      tenantId,
      req.user.userId,
      transactionId,
      format || ReceiptFormat.THERMAL_80MM,
    );
  }
}
