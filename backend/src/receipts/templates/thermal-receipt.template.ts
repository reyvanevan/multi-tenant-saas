import { EscPosCommands } from './escpos-commands';

export interface ReceiptData {
  // Header
  outletName: string;
  outletAddress?: string;
  outletPhone?: string;
  logo?: string;
  customHeader?: string;

  // Transaction
  transactionNumber: string;
  transactionDate: Date;
  cashierName: string;
  shiftNumber?: string;

  // Items
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tax?: number;
    subtotal: number;
  }>;

  // Totals
  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  // Payment
  paymentMethod: string;
  amountPaid: number;
  change?: number;

  // Customer
  customerName?: string;
  customerPhone?: string;

  // Footer
  customFooter?: string;
  qrCodeData?: string;
}

export class ThermalReceiptTemplate {
  private cmd = EscPosCommands;

  /**
   * Generate 58mm thermal receipt
   * Paper width: ~32 characters
   */
  generate58mm(data: ReceiptData): string {
    const width = 32;
    let receipt = '';

    // Initialize
    receipt += this.cmd.init();

    // Header
    receipt += this.cmd.alignCenter();
    receipt += this.cmd.bold(true);
    receipt += this.cmd.doubleWidth(true);
    receipt += data.outletName + this.cmd.LF;
    receipt += this.cmd.doubleWidth(false);
    receipt += this.cmd.bold(false);

    if (data.outletAddress) {
      receipt += data.outletAddress + this.cmd.LF;
    }
    if (data.outletPhone) {
      receipt += 'Telp: ' + data.outletPhone + this.cmd.LF;
    }

    if (data.customHeader) {
      receipt += this.cmd.newLine(1);
      receipt += data.customHeader + this.cmd.LF;
    }

    receipt += this.cmd.separator('=', width);
    receipt += this.cmd.alignLeft();

    // Transaction info
    receipt += `No: ${data.transactionNumber}${this.cmd.LF}`;
    receipt += `Tgl: ${this.cmd.formatDate(data.transactionDate)}${this.cmd.LF}`;
    receipt += `Kasir: ${data.cashierName}${this.cmd.LF}`;
    if (data.shiftNumber) {
      receipt += `Shift: ${data.shiftNumber}${this.cmd.LF}`;
    }
    if (data.customerName) {
      receipt += `Customer: ${data.customerName}${this.cmd.LF}`;
    }

    receipt += this.cmd.separator('-', width);

    // Items
    for (const item of data.items) {
      // Item name
      receipt += item.name + this.cmd.LF;

      // Quantity x Price = Subtotal
      const qtyLine = `${item.quantity}x${this.cmd.formatCurrency(item.unitPrice)}`;
      const subtotalStr = this.cmd.formatCurrency(item.subtotal);
      receipt +=
        this.cmd.padText(qtyLine, subtotalStr, width) + this.cmd.LF;

      // Discount if any
      if (item.discount && item.discount > 0) {
        receipt +=
          this.cmd.padText('  Diskon', `-${this.cmd.formatCurrency(item.discount)}`, width) +
          this.cmd.LF;
      }
    }

    receipt += this.cmd.separator('-', width);

    // Totals
    receipt +=
      this.cmd.padText('Subtotal', this.cmd.formatCurrency(data.subtotal), width) +
      this.cmd.LF;

    if (data.discount > 0) {
      receipt +=
        this.cmd.padText('Diskon', `-${this.cmd.formatCurrency(data.discount)}`, width) +
        this.cmd.LF;
    }

    if (data.tax > 0) {
      receipt +=
        this.cmd.padText('PPN 11%', this.cmd.formatCurrency(data.tax), width) +
        this.cmd.LF;
    }

    receipt += this.cmd.separator('-', width);
    receipt += this.cmd.bold(true);
    receipt += this.cmd.doubleWidth(true);
    receipt +=
      this.cmd.padText('TOTAL', this.cmd.formatCurrency(data.total), width) +
      this.cmd.LF;
    receipt += this.cmd.doubleWidth(false);
    receipt += this.cmd.bold(false);

    // Payment
    receipt += this.cmd.separator('-', width);
    receipt +=
      this.cmd.padText(data.paymentMethod.toUpperCase(), this.cmd.formatCurrency(data.amountPaid), width) +
      this.cmd.LF;

    if (data.change !== undefined && data.change > 0) {
      receipt +=
        this.cmd.padText('Kembali', this.cmd.formatCurrency(data.change), width) +
        this.cmd.LF;
    }

    // QR Code
    if (data.qrCodeData) {
      receipt += this.cmd.newLine(1);
      receipt += this.cmd.alignCenter();
      receipt += this.cmd.qrCode(data.qrCodeData, 4);
      receipt += this.cmd.newLine(1);
    }

    // Footer
    receipt += this.cmd.alignCenter();
    receipt += this.cmd.separator('=', width);
    receipt += 'Terima Kasih' + this.cmd.LF;
    receipt += 'Selamat Berbelanja Kembali' + this.cmd.LF;

    if (data.customFooter) {
      receipt += this.cmd.newLine(1);
      receipt += data.customFooter + this.cmd.LF;
    }

    receipt += this.cmd.newLine(2);
    receipt += this.cmd.cut();

    return receipt;
  }

  /**
   * Generate 80mm thermal receipt
   * Paper width: ~48 characters
   */
  generate80mm(data: ReceiptData): string {
    const width = 48;
    let receipt = '';

    // Initialize
    receipt += this.cmd.init();

    // Header
    receipt += this.cmd.alignCenter();
    receipt += this.cmd.bold(true);
    receipt += this.cmd.doubleSize(true);
    receipt += data.outletName + this.cmd.LF;
    receipt += this.cmd.doubleSize(false);
    receipt += this.cmd.bold(false);

    if (data.outletAddress) {
      receipt += data.outletAddress + this.cmd.LF;
    }
    if (data.outletPhone) {
      receipt += 'Telp: ' + data.outletPhone + this.cmd.LF;
    }

    if (data.customHeader) {
      receipt += this.cmd.newLine(1);
      receipt += data.customHeader + this.cmd.LF;
    }

    receipt += this.cmd.separator('=', width);
    receipt += this.cmd.alignLeft();

    // Transaction info
    receipt += this.cmd.tableRow([
      { text: 'No. Transaksi', width: 20 },
      { text: ': ' + data.transactionNumber, width: 28 },
    ]);
    receipt += this.cmd.tableRow([
      { text: 'Tanggal', width: 20 },
      { text: ': ' + this.cmd.formatDate(data.transactionDate), width: 28 },
    ]);
    receipt += this.cmd.tableRow([
      { text: 'Kasir', width: 20 },
      { text: ': ' + data.cashierName, width: 28 },
    ]);
    if (data.shiftNumber) {
      receipt += this.cmd.tableRow([
        { text: 'Shift', width: 20 },
        { text: ': ' + data.shiftNumber, width: 28 },
      ]);
    }
    if (data.customerName) {
      receipt += this.cmd.tableRow([
        { text: 'Customer', width: 20 },
        { text: ': ' + data.customerName, width: 28 },
      ]);
    }

    receipt += this.cmd.separator('-', width);

    // Items header
    receipt += this.cmd.tableRow([
      { text: 'Item', width: 24 },
      { text: 'Qty', width: 6, align: 'right' },
      { text: 'Harga', width: 10, align: 'right' },
      { text: 'Total', width: 8, align: 'right' },
    ]);
    receipt += this.cmd.separator('-', width);

    // Items
    for (const item of data.items) {
      receipt += item.name + this.cmd.LF;

      const qtyStr = item.quantity.toString();
      const priceStr = this.cmd.formatCurrency(item.unitPrice);
      const totalStr = this.cmd.formatCurrency(item.subtotal);

      receipt += this.cmd.tableRow([
        { text: item.sku || '', width: 24 },
        { text: qtyStr, width: 6, align: 'right' },
        { text: priceStr, width: 10, align: 'right' },
        { text: totalStr, width: 8, align: 'right' },
      ]);

      if (item.discount && item.discount > 0) {
        receipt +=
          this.cmd.padText(
            '  Diskon',
            `-${this.cmd.formatCurrency(item.discount)}`,
            width,
          ) + this.cmd.LF;
      }
    }

    receipt += this.cmd.separator('-', width);

    // Totals
    receipt +=
      this.cmd.padText('Subtotal', this.cmd.formatCurrency(data.subtotal), width) +
      this.cmd.LF;

    if (data.discount > 0) {
      receipt +=
        this.cmd.padText('Diskon Total', `-${this.cmd.formatCurrency(data.discount)}`, width) +
        this.cmd.LF;
    }

    if (data.tax > 0) {
      receipt +=
        this.cmd.padText('PPN 11%', this.cmd.formatCurrency(data.tax), width) +
        this.cmd.LF;
    }

    receipt += this.cmd.separator('=', width);
    receipt += this.cmd.bold(true);
    receipt += this.cmd.setFontSize(1);
    receipt +=
      this.cmd.padText('TOTAL BAYAR', this.cmd.formatCurrency(data.total), width) +
      this.cmd.LF;
    receipt += this.cmd.setFontSize(0);
    receipt += this.cmd.bold(false);
    receipt += this.cmd.separator('=', width);

    // Payment
    receipt +=
      this.cmd.padText(
        data.paymentMethod.toUpperCase(),
        this.cmd.formatCurrency(data.amountPaid),
        width,
      ) + this.cmd.LF;

    if (data.change !== undefined && data.change > 0) {
      receipt += this.cmd.bold(true);
      receipt +=
        this.cmd.padText('Kembali', this.cmd.formatCurrency(data.change), width) +
        this.cmd.LF;
      receipt += this.cmd.bold(false);
    }

    // QR Code
    if (data.qrCodeData) {
      receipt += this.cmd.newLine(2);
      receipt += this.cmd.alignCenter();
      receipt += 'Scan untuk verifikasi' + this.cmd.LF;
      receipt += this.cmd.qrCode(data.qrCodeData, 6);
      receipt += this.cmd.newLine(1);
    }

    // Footer
    receipt += this.cmd.alignCenter();
    receipt += this.cmd.separator('=', width);
    receipt += this.cmd.bold(true);
    receipt += 'TERIMA KASIH' + this.cmd.LF;
    receipt += this.cmd.bold(false);
    receipt += 'Barang yang sudah dibeli' + this.cmd.LF;
    receipt += 'tidak dapat ditukar/dikembalikan' + this.cmd.LF;

    if (data.customFooter) {
      receipt += this.cmd.newLine(1);
      receipt += data.customFooter + this.cmd.LF;
    }

    receipt += this.cmd.newLine(3);
    receipt += this.cmd.cut();

    return receipt;
  }

  /**
   * Generate HTML receipt for preview/email
   */
  generateHTML(data: ReceiptData): string {
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
      font-size: 12px;
      max-width: 400px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ccc;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h2 {
      margin: 0 0 10px 0;
      font-size: 18px;
    }
    .separator {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .item {
      margin: 10px 0;
    }
    .item-name {
      font-weight: bold;
    }
    .item-details {
      display: flex;
      justify-content: space-between;
      margin-left: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .total-row.grand-total {
      font-weight: bold;
      font-size: 14px;
      border-top: 2px solid #000;
      padding-top: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>${data.outletName}</h2>
    ${data.outletAddress ? `<div>${data.outletAddress}</div>` : ''}
    ${data.outletPhone ? `<div>Telp: ${data.outletPhone}</div>` : ''}
    ${data.customHeader ? `<div style="margin-top: 10px;">${data.customHeader}</div>` : ''}
  </div>

  <div class="separator"></div>

  <div class="info-row"><span>No. Transaksi</span><span>${data.transactionNumber}</span></div>
  <div class="info-row"><span>Tanggal</span><span>${this.cmd.formatDate(data.transactionDate)}</span></div>
  <div class="info-row"><span>Kasir</span><span>${data.cashierName}</span></div>
  ${data.shiftNumber ? `<div class="info-row"><span>Shift</span><span>${data.shiftNumber}</span></div>` : ''}
  ${data.customerName ? `<div class="info-row"><span>Customer</span><span>${data.customerName}</span></div>` : ''}

  <div class="separator"></div>

  ${data.items
    .map(
      (item) => `
    <div class="item">
      <div class="item-name">${item.name}</div>
      <div class="item-details">
        <span>${item.quantity} x ${this.cmd.formatCurrency(item.unitPrice)}</span>
        <span>${this.cmd.formatCurrency(item.subtotal)}</span>
      </div>
      ${
        item.discount && item.discount > 0
          ? `<div class="item-details" style="margin-left: 20px;">
               <span>Diskon</span>
               <span>-${this.cmd.formatCurrency(item.discount)}</span>
             </div>`
          : ''
      }
    </div>
  `,
    )
    .join('')}

  <div class="separator"></div>

  <div class="total-row"><span>Subtotal</span><span>${this.cmd.formatCurrency(data.subtotal)}</span></div>
  ${data.discount > 0 ? `<div class="total-row"><span>Diskon</span><span>-${this.cmd.formatCurrency(data.discount)}</span></div>` : ''}
  ${data.tax > 0 ? `<div class="total-row"><span>PPN 11%</span><span>${this.cmd.formatCurrency(data.tax)}</span></div>` : ''}
  
  <div class="total-row grand-total">
    <span>TOTAL</span>
    <span>${this.cmd.formatCurrency(data.total)}</span>
  </div>

  <div class="separator"></div>

  <div class="total-row"><span>${data.paymentMethod.toUpperCase()}</span><span>${this.cmd.formatCurrency(data.amountPaid)}</span></div>
  ${data.change !== undefined && data.change > 0 ? `<div class="total-row"><span>Kembali</span><span>${this.cmd.formatCurrency(data.change)}</span></div>` : ''}

  ${
    data.qrCodeData
      ? `
    <div class="qr-code">
      <p>Scan untuk verifikasi</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.qrCodeData)}" alt="QR Code">
    </div>
  `
      : ''
  }

  <div class="separator"></div>

  <div class="footer">
    <strong>TERIMA KASIH</strong>
    <div>Selamat Berbelanja Kembali</div>
    ${data.customFooter ? `<div style="margin-top: 10px;">${data.customFooter}</div>` : ''}
  </div>
</body>
</html>
    `.trim();
  }
}
