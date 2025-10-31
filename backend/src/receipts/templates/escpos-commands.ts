/**
 * ESC/POS Command Generator for Thermal Printers
 * Supports 58mm and 80mm receipt printers
 */

export class EscPosCommands {
  // ESC/POS control characters
  static readonly ESC = '\x1B';
  static readonly GS = '\x1D';
  static readonly LF = '\x0A';
  static readonly CR = '\x0D';

  // Initialize printer
  static init(): string {
    return this.ESC + '@';
  }

  // Text alignment
  static alignLeft(): string {
    return this.ESC + 'a' + '\x00';
  }

  static alignCenter(): string {
    return this.ESC + 'a' + '\x01';
  }

  static alignRight(): string {
    return this.ESC + 'a' + '\x02';
  }

  // Text formatting
  static bold(enable = true): string {
    return this.ESC + 'E' + (enable ? '\x01' : '\x00');
  }

  static underline(enable = true): string {
    return this.ESC + '-' + (enable ? '\x01' : '\x00');
  }

  static doubleWidth(enable = true): string {
    return this.GS + '!' + (enable ? '\x10' : '\x00');
  }

  static doubleHeight(enable = true): string {
    return this.GS + '!' + (enable ? '\x01' : '\x00');
  }

  static doubleSize(enable = true): string {
    return this.GS + '!' + (enable ? '\x11' : '\x00');
  }

  static setFontSize(size: 0 | 1 | 2 | 3): string {
    const sizeMap = {
      0: '\x00', // Normal
      1: '\x10', // Double width
      2: '\x01', // Double height
      3: '\x11', // Double both
    };
    return this.GS + '!' + sizeMap[size];
  }

  // Line feed
  static newLine(lines = 1): string {
    return this.LF.repeat(lines);
  }

  static feedLines(lines: number): string {
    return this.ESC + 'd' + String.fromCharCode(lines);
  }

  // Separator line
  static separator(char = '-', width = 32): string {
    return char.repeat(width) + this.LF;
  }

  // Cut paper
  static cut(): string {
    return this.GS + 'V' + '\x00'; // Full cut
  }

  static partialCut(): string {
    return this.GS + 'V' + '\x01'; // Partial cut
  }

  // QR Code (if supported)
  static qrCode(data: string, size = 6): string {
    const qr = this.GS + '(k';
    const len = data.length + 3;
    const pL = String.fromCharCode(len % 256);
    const pH = String.fromCharCode(Math.floor(len / 256));

    let commands = '';
    // QR code model
    commands += qr + '\x04\x00\x31\x41\x32\x00';
    // QR code size
    commands += qr + '\x03\x00\x31\x43' + String.fromCharCode(size);
    // QR code error correction (L=0, M=1, Q=2, H=3)
    commands += qr + '\x03\x00\x31\x45\x30';
    // Store QR data
    commands += qr + pL + pH + '\x31\x50\x30' + data;
    // Print QR code
    commands += qr + '\x03\x00\x31\x51\x30';

    return commands;
  }

  // Barcode (Code39, EAN13, etc)
  static barcode(data: string, type = 4): string {
    // Type: 0=UPC-A, 1=UPC-E, 2=EAN13, 3=EAN8, 4=CODE39, 5=ITF, 6=CODABAR, 73=CODE128
    return (
      this.GS +
      'k' +
      String.fromCharCode(type) +
      String.fromCharCode(data.length) +
      data
    );
  }

  // Open cash drawer
  static openDrawer(): string {
    return this.ESC + 'p' + '\x00' + '\x19' + '\xFA';
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Format date
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  // Pad text to fixed width
  static padText(
    left: string,
    right: string,
    width: number,
    fillChar = ' ',
  ): string {
    const availableWidth = width - left.length - right.length;
    if (availableWidth < 0) {
      // Truncate if too long
      return left.substring(0, width - right.length - 3) + '...' + right;
    }
    return left + fillChar.repeat(availableWidth) + right;
  }

  // Table row
  static tableRow(
    columns: Array<{ text: string; width: number; align?: 'left' | 'right' }>,
  ): string {
    return (
      columns
        .map((col) => {
          if (col.align === 'right') {
            return col.text.padStart(col.width, ' ');
          }
          return col.text.padEnd(col.width, ' ');
        })
        .join('') + this.LF
    );
  }
}
