import { EscPosCommands } from './escpos-commands';

export interface ReceiptData {
  // Tenant & Outlet info
  tenantName: string;
  outletName: string;
  outletAddress?: string;
  outletPhone?: string;
  taxNumber?: string;

  // Transaction info
  transactionNumber: string;
  transactionDate: Date;
  cashierName: string;

  // Items
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
  }>;

  // Totals
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  
  // Payment
  paymentMethod: string;
  amountPaid: number;
  change: number;

  // Customer info (optional)
  customerName?: string;
  customerPhone?: string;

  // Custom
  headerText?: string;
  footerText?: string;
  qrCodeData?: string;
}

export class ReceiptBuilder {
  private static readonly WIDTH_58MM = 32;
  private static readonly WIDTH_80MM = 48;

  /**
   * Generate thermal receipt for 58mm or 80mm printer
   */
  static generateThermalReceipt(
    data: ReceiptData,
    width: 'THERMAL_58MM' | 'THERMAL_80MM' = 'THERMAL_80MM',
  ): string {
    const maxWidth =
      width === 'THERMAL_58MM' ? this.WIDTH_58MM : this.WIDTH_80MM;
    let receipt = '';

    // Initialize printer
    receipt += EscPosCommands.init();

    // Header - Outlet Info (Centered)
    receipt += EscPosCommands.alignCenter();
    receipt += EscPosCommands.doubleSize(true);
    receipt += data.outletName.toUpperCase() + EscPosCommands.LF;
    receipt += EscPosCommands.doubleSize(false);
    
    if (data.tenantName) {
      receipt += EscPosCommands.bold(true);
      receipt += data.tenantName + EscPosCommands.LF;
      receipt += EscPosCommands.bold(false);
    }

    if (data.outletAddress) {
      receipt += data.outletAddress + EscPosCommands.LF;
    }
    if (data.outletPhone) {
      receipt += 'Telp: ' + data.outletPhone + EscPosCommands.LF;
    }
    if (data.taxNumber) {
      receipt += 'NPWP: ' + data.taxNumber + EscPosCommands.LF;
    }

    // Custom header text
    if (data.headerText) {
      receipt += EscPosCommands.newLine();
      receipt += data.headerText + EscPosCommands.LF;
    }

    receipt += EscPosCommands.separator('=', maxWidth);

    // Transaction Info (Left aligned)
    receipt += EscPosCommands.alignLeft();
    receipt += EscPosCommands.padText(
      'No. Transaksi',
      data.transactionNumber,
      maxWidth,
    );
    receipt += EscPosCommands.padText(
      'Tanggal',
      EscPosCommands.formatDate(data.transactionDate),
      maxWidth,
    );
    receipt += EscPosCommands.padText(
      'Kasir',
      data.cashierName,
      maxWidth,
    );

    if (data.customerName) {
      receipt += EscPosCommands.padText(
        'Pelanggan',
        data.customerName,
        maxWidth,
      );
    }

    receipt += EscPosCommands.separator('-', maxWidth);

    // Items
    receipt += EscPosCommands.bold(true);
    receipt += EscPosCommands.tableRow([
      { text: 'Item', width: maxWidth - 16, align: 'left' },
      { text: 'Qty', width: 4, align: 'right' },
      { text: 'Harga', width: 12, align: 'right' },
    ]);
    receipt += EscPosCommands.bold(false);

    data.items.forEach((item) => {
      // Item name
      receipt += item.name + EscPosCommands.LF;
      
      // Qty x Price = Total
      const qtyText = `${item.quantity}x`;
      const priceText = EscPosCommands.formatCurrency(item.unitPrice);
      const totalText = EscPosCommands.formatCurrency(item.total);
      
      receipt += EscPosCommands.padText(
        '  ' + qtyText + ' ' + priceText,
        totalText,
        maxWidth,
      );

      // Show discount if any
      if (item.discount > 0) {
        receipt += EscPosCommands.padText(
          '  Diskon',
          '-' + EscPosCommands.formatCurrency(item.discount),
          maxWidth,
        );
      }
    });

    receipt += EscPosCommands.separator('-', maxWidth);

    // Totals
    receipt += EscPosCommands.padText(
      'Subtotal',
      EscPosCommands.formatCurrency(data.subtotal),
      maxWidth,
    );

    if (data.discount > 0) {
      receipt += EscPosCommands.padText(
        'Diskon',
        '-' + EscPosCommands.formatCurrency(data.discount),
        maxWidth,
      );
    }

    if (data.tax > 0) {
      receipt += EscPosCommands.padText(
        'PPN 11%',
        EscPosCommands.formatCurrency(data.tax),
        maxWidth,
      );
    }

    receipt += EscPosCommands.separator('=', maxWidth);

    receipt += EscPosCommands.bold(true);
    receipt += EscPosCommands.doubleWidth(true);
    receipt += EscPosCommands.padText(
      'TOTAL',
      EscPosCommands.formatCurrency(data.total),
      maxWidth,
    );
    receipt += EscPosCommands.doubleWidth(false);
    receipt += EscPosCommands.bold(false);

    receipt += EscPosCommands.separator('-', maxWidth);

    // Payment info
    receipt += EscPosCommands.padText(
      data.paymentMethod.toUpperCase(),
      EscPosCommands.formatCurrency(data.amountPaid),
      maxWidth,
    );

    if (data.change > 0) {
      receipt += EscPosCommands.padText(
        'Kembali',
        EscPosCommands.formatCurrency(data.change),
        maxWidth,
      );
    }

    receipt += EscPosCommands.separator('=', maxWidth);

    // QR Code (if provided)
    if (data.qrCodeData) {
      receipt += EscPosCommands.alignCenter();
      receipt += EscPosCommands.newLine();
      receipt += EscPosCommands.qrCode(data.qrCodeData, 6);
      receipt += EscPosCommands.newLine(2);
    }

    // Footer
    receipt += EscPosCommands.alignCenter();
    receipt += EscPosCommands.newLine();
    
    if (data.footerText) {
      receipt += data.footerText + EscPosCommands.LF;
    } else {
      receipt += 'Terima kasih atas kunjungan Anda' + EscPosCommands.LF;
      receipt += 'Barang yang sudah dibeli' + EscPosCommands.LF;
      receipt += 'tidak dapat dikembalikan' + EscPosCommands.LF;
    }

    // Cut paper
    receipt += EscPosCommands.newLine(3);
    receipt += EscPosCommands.partialCut();

    return receipt;
  }

  /**
   * Generate HTML receipt for email/web view
   */
  static generateHtmlReceipt(data: ReceiptData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Struk - ${data.transactionNumber}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      max-width: 400px;
      margin: 20px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .receipt {
      background: white;
      padding: 20px;
      border: 1px solid #ddd;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 5px 0;
      font-size: 18px;
    }
    .header p {
      margin: 3px 0;
      font-size: 12px;
    }
    .info {
      margin: 10px 0;
      font-size: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    .items {
      margin: 10px 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 10px 0;
    }
    .item {
      margin: 5px 0;
      font-size: 12px;
    }
    .item-name {
      font-weight: bold;
    }
    .item-detail {
      display: flex;
      justify-content: space-between;
      padding-left: 10px;
    }
    .totals {
      margin: 10px 0;
      font-size: 12px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .total-row.grand {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #000;
      padding-top: 5px;
    }
    .payment {
      border-top: 1px dashed #000;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 12px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px solid #000;
      font-size: 11px;
    }
    @media print {
      body {
        background: white;
        margin: 0;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>${data.outletName.toUpperCase()}</h1>
      ${data.tenantName ? `<p><strong>${data.tenantName}</strong></p>` : ''}
      ${data.outletAddress ? `<p>${data.outletAddress}</p>` : ''}
      ${data.outletPhone ? `<p>Telp: ${data.outletPhone}</p>` : ''}
      ${data.taxNumber ? `<p>NPWP: ${data.taxNumber}</p>` : ''}
      ${data.headerText ? `<p>${data.headerText}</p>` : ''}
    </div>

    <div class="info">
      <div class="info-row">
        <span>No. Transaksi:</span>
        <span>${data.transactionNumber}</span>
      </div>
      <div class="info-row">
        <span>Tanggal:</span>
        <span>${EscPosCommands.formatDate(data.transactionDate)}</span>
      </div>
      <div class="info-row">
        <span>Kasir:</span>
        <span>${data.cashierName}</span>
      </div>
      ${
        data.customerName
          ? `<div class="info-row">
        <span>Pelanggan:</span>
        <span>${data.customerName}</span>
      </div>`
          : ''
      }
    </div>

    <div class="items">
      ${data.items
        .map(
          (item) => `
        <div class="item">
          <div class="item-name">${item.name}</div>
          <div class="item-detail">
            <span>${item.quantity} x ${EscPosCommands.formatCurrency(item.unitPrice)}</span>
            <span>${EscPosCommands.formatCurrency(item.total)}</span>
          </div>
          ${
            item.discount > 0
              ? `<div class="item-detail">
            <span>Diskon</span>
            <span>-${EscPosCommands.formatCurrency(item.discount)}</span>
          </div>`
              : ''
          }
        </div>
      `,
        )
        .join('')}
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${EscPosCommands.formatCurrency(data.subtotal)}</span>
      </div>
      ${
        data.discount > 0
          ? `<div class="total-row">
        <span>Diskon:</span>
        <span>-${EscPosCommands.formatCurrency(data.discount)}</span>
      </div>`
          : ''
      }
      ${
        data.tax > 0
          ? `<div class="total-row">
        <span>PPN 11%:</span>
        <span>${EscPosCommands.formatCurrency(data.tax)}</span>
      </div>`
          : ''
      }
      <div class="total-row grand">
        <span>TOTAL:</span>
        <span>${EscPosCommands.formatCurrency(data.total)}</span>
      </div>
    </div>

    <div class="payment">
      <div class="total-row">
        <span>${data.paymentMethod.toUpperCase()}:</span>
        <span>${EscPosCommands.formatCurrency(data.amountPaid)}</span>
      </div>
      ${
        data.change > 0
          ? `<div class="total-row">
        <span>Kembali:</span>
        <span>${EscPosCommands.formatCurrency(data.change)}</span>
      </div>`
          : ''
      }
    </div>

    ${
      data.qrCodeData
        ? `<div style="text-align: center; margin: 20px 0;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qrCodeData)}" alt="QR Code" />
    </div>`
        : ''
    }

    <div class="footer">
      ${
        data.footerText
          ? data.footerText
          : `
      <p>Terima kasih atas kunjungan Anda</p>
      <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
      `
      }
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
