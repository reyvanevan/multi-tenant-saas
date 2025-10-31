import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import {
  ThermalReceiptTemplate,
  ReceiptData,
} from './templates/thermal-receipt.template';
import { ReceiptFormat } from './dto';

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionsService,
  ) {}

  /**
   * Generate receipt for transaction
   */
  async generateReceipt(
    tenantId: string,
    transactionId: string,
    format: ReceiptFormat = ReceiptFormat.THERMAL_80MM,
    options?: {
      includeQrCode?: boolean;
      customHeader?: string;
      customFooter?: string;
    },
  ) {
    // Get transaction details
    const result = await this.transactions.findOne(tenantId, transactionId);
    const transaction = result.transaction;

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Get tenant settings for receipt customization
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Get outlet with full details
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: transaction.outletId },
      select: {
        name: true,
        address: true,
        phone: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    });

    // Build receipt data
    const receiptData: ReceiptData = {
      // Header
      outletName: outlet?.name || transaction.outlet.name,
      outletAddress: outlet?.address || undefined,
      outletPhone: outlet?.phone || undefined,
      customHeader: options?.customHeader,

      // Transaction
      transactionNumber: transaction.transactionNumber,
      transactionDate: transaction.createdAt,
      cashierName: `${transaction.user.firstName} ${transaction.user.lastName}`,
      shiftNumber: transaction.shift?.shiftNumber,

      // Items
      items: transaction.items.map((item) => ({
        name: item.productName,
        sku: item.productSku || item.product?.sku || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        subtotal: item.subtotal,
      })),

      // Totals
      subtotal: transaction.subtotal,
      discount: transaction.discount || 0,
      tax: transaction.tax,
      total: transaction.total,

      // Payment
      paymentMethod: transaction.paymentMethod,
      amountPaid: transaction.amountPaid || transaction.total,
      change: (transaction.amountPaid || transaction.total) - transaction.total,

      // Customer
      customerName: transaction.customerName || undefined,
      customerPhone: transaction.customerPhone || undefined,

      // Footer
      customFooter: options?.customFooter,
      qrCodeData: options?.includeQrCode
        ? `https://pos.example.com/verify/${transactionId}`
        : undefined,
    };

    // Generate receipt based on format
    const template = new ThermalReceiptTemplate();

    let receiptContent: string;
    let contentType: string;

    switch (format) {
      case ReceiptFormat.THERMAL_58MM:
        receiptContent = template.generate58mm(receiptData);
        contentType = 'text/plain';
        break;

      case ReceiptFormat.THERMAL_80MM:
        receiptContent = template.generate80mm(receiptData);
        contentType = 'text/plain';
        break;

      case ReceiptFormat.HTML:
        receiptContent = template.generateHTML(receiptData);
        contentType = 'text/html';
        break;

      case ReceiptFormat.A4:
        // For A4, use HTML template (can be converted to PDF later)
        receiptContent = template.generateHTML(receiptData);
        contentType = 'text/html';
        break;

      default:
        receiptContent = template.generate80mm(receiptData);
        contentType = 'text/plain';
    }

    return {
      message: 'Receipt generated successfully',
      receipt: {
        transactionId,
        transactionNumber: transaction.transactionNumber,
        format,
        contentType,
        content: receiptContent,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Send receipt via email
   */
  async sendReceiptEmail(
    tenantId: string,
    transactionId: string,
    email: string,
    options?: {
      subject?: string;
      message?: string;
    },
  ) {
    // Generate HTML receipt
    const receipt = await this.generateReceipt(
      tenantId,
      transactionId,
      ReceiptFormat.HTML,
      { includeQrCode: true },
    );

    // TODO: Integrate with email service (e.g., SendGrid, AWS SES, Nodemailer)
    // For now, return the receipt data
    console.log(`Sending receipt to ${email}`);
    console.log(`Subject: ${options?.subject || 'Struk Pembelian'}`);
    console.log(`Message: ${options?.message || ''}`);

    return {
      message: 'Receipt email queued for sending',
      email,
      transactionId,
      subject: options?.subject || `Struk - ${receipt.receipt.transactionNumber}`,
    };
  }

  /**
   * Send receipt via WhatsApp
   * Requires WhatsApp Business API or third-party service (e.g., Twilio, Fonnte)
   */
  async sendReceiptWhatsApp(
    tenantId: string,
    transactionId: string,
    phoneNumber: string,
    options?: {
      message?: string;
    },
  ) {
    // Check if WhatsApp integration is enabled
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // TODO: Check tenant features for whatsapp_integration
    // if (!tenant.features?.whatsapp_integration) {
    //   throw new BadRequestException(
    //     'WhatsApp integration is not enabled for this tenant',
    //   );
    // }

    // Generate receipt text
    const receipt = await this.generateReceipt(
      tenantId,
      transactionId,
      ReceiptFormat.THERMAL_58MM,
      { includeQrCode: false },
    );

    // Build WhatsApp message
    const whatsappMessage = `
${options?.message || 'Terima kasih atas pembelian Anda!'}

${receipt.receipt.content}

Verifikasi: https://pos.example.com/verify/${transactionId}
    `.trim();

    // TODO: Integrate with WhatsApp API (Twilio, Fonnte, etc.)
    console.log(`Sending receipt to WhatsApp: ${phoneNumber}`);
    console.log(whatsappMessage);

    return {
      message: 'Receipt WhatsApp queued for sending',
      phoneNumber,
      transactionId,
    };
  }

  /**
   * Get receipt history for a transaction
   */
  async getReceiptHistory(tenantId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, tenantId },
      select: {
        id: true,
        transactionNumber: true,
        createdAt: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // TODO: Track receipt generation/send history in database
    // For now, return basic info
    return {
      transactionId,
      transactionNumber: transaction.transactionNumber,
      history: [
        {
          action: 'generated',
          timestamp: transaction.createdAt,
          format: 'THERMAL_80MM',
        },
      ],
    };
  }

  /**
   * Reprint receipt (for voided/reprinted receipts tracking)
   */
  async reprintReceipt(
    tenantId: string,
    userId: string,
    transactionId: string,
    format: ReceiptFormat = ReceiptFormat.THERMAL_80MM,
  ) {
    const receipt = await this.generateReceipt(tenantId, transactionId, format, {
      includeQrCode: true,
      customFooter: '** REPRINT **',
    });

    // TODO: Log reprint action in audit trail
    console.log(`Receipt reprinted by user ${userId}`);

    return receipt;
  }
}
