import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = this.configService.get<number>('SMTP_PORT') || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM') || 'noreply@bermadani.id';

    if (!user || !pass) {
      this.logger.warn('SMTP credentials not configured. Email service disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      from,
    });

    this.logger.log(`Email service initialized with SMTP: ${host}:${port}`);
  }

  /**
   * Send email with template
   */
  async sendMail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email send.');
      return;
    }

    try {
      const html = await this.renderTemplate(options.template, options.context);

      const mailOptions: nodemailer.SendMailOptions = {
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error}`);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, name: string, tenantName: string) {
    await this.sendMail({
      to: email,
      subject: `Selamat Datang di ${tenantName}!`,
      template: 'welcome',
      context: {
        name,
        tenantName,
        loginUrl: this.configService.get<string>('APP_URL') || 'https://app.bermadani.id',
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, resetToken: string) {
    const resetUrl = `${this.configService.get<string>('APP_URL')}/reset-password?token=${resetToken}`;

    await this.sendMail({
      to: email,
      subject: 'Reset Password Akun Anda',
      template: 'password-reset',
      context: {
        name,
        resetUrl,
        expiresIn: '1 jam',
      },
    });
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(
    email: string,
    name: string,
    invoiceNumber: string,
    amount: number,
    dueDate: Date,
  ) {
    await this.sendMail({
      to: email,
      subject: `Invoice #${invoiceNumber} - Bermadani`,
      template: 'invoice',
      context: {
        name,
        invoiceNumber,
        amount: this.formatCurrency(amount),
        dueDate: this.formatDate(dueDate),
        paymentUrl: `${this.configService.get<string>('APP_URL')}/billing/invoices/${invoiceNumber}`,
      },
    });
  }

  /**
   * Send subscription renewal reminder
   */
  async sendSubscriptionRenewalReminder(
    email: string,
    name: string,
    planName: string,
    expiryDate: Date,
  ) {
    await this.sendMail({
      to: email,
      subject: 'Pengingat Perpanjangan Subscription',
      template: 'subscription-renewal',
      context: {
        name,
        planName,
        expiryDate: this.formatDate(expiryDate),
        renewUrl: `${this.configService.get<string>('APP_URL')}/billing`,
      },
    });
  }

  /**
   * Send subscription expired notification
   */
  async sendSubscriptionExpiredEmail(
    email: string,
    name: string,
    planName: string,
  ) {
    await this.sendMail({
      to: email,
      subject: 'Subscription Anda Telah Berakhir',
      template: 'subscription-expired',
      context: {
        name,
        planName,
        renewUrl: `${this.configService.get<string>('APP_URL')}/billing`,
      },
    });
  }

  /**
   * Send transaction receipt
   */
  async sendTransactionReceipt(
    email: string,
    customerName: string,
    transactionId: string,
    total: number,
    items: Array<{ name: string; quantity: number; price: number }>,
  ) {
    await this.sendMail({
      to: email,
      subject: `Struk Pembayaran #${transactionId}`,
      template: 'receipt',
      context: {
        customerName,
        transactionId,
        total: this.formatCurrency(total),
        items,
        date: this.formatDate(new Date()),
      },
    });
  }

  /**
   * Render email template
   */
  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    // Check cache
    let template = this.templatesCache.get(templateName);

    if (!template) {
      // Load template file
      const templatePath = path.join(
        __dirname,
        '../../templates/emails',
        `${templateName}.hbs`,
      );

      if (!fs.existsSync(templatePath)) {
        this.logger.warn(`Template not found: ${templateName}, using fallback`);
        return this.renderFallbackTemplate(templateName, context);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      template = handlebars.compile(templateContent);
      this.templatesCache.set(templateName, template);
    }

    return template(context);
  }

  /**
   * Fallback template when file template doesn't exist
   */
  private renderFallbackTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bermadani</h1>
          </div>
          <div class="content">
            {{content}}
          </div>
          <div class="footer">
            <p>&copy; 2025 Bermadani. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let content = '';
    switch (templateName) {
      case 'welcome':
        content = `<h2>Selamat Datang, ${context.name}!</h2><p>Terima kasih telah bergabung dengan ${context.tenantName}.</p>`;
        break;
      case 'password-reset':
        content = `<h2>Reset Password</h2><p>Halo ${context.name}, klik tombol di bawah untuk reset password:</p><a href="${context.resetUrl}" class="button">Reset Password</a>`;
        break;
      case 'invoice':
        content = `<h2>Invoice #${context.invoiceNumber}</h2><p>Total: ${context.amount}</p><p>Jatuh tempo: ${context.dueDate}</p>`;
        break;
      default:
        content = `<h2>Notification</h2><p>${JSON.stringify(context)}</p>`;
    }

    const template = handlebars.compile(baseTemplate);
    return template({ content });
  }

  /**
   * Format currency to IDR
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount / 10000); // Convert from cents
  }

  /**
   * Format date to Indonesian locale
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  /**
   * Verify transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection failed:', error);
      return false;
    }
  }
}
