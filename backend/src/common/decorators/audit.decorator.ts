import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export const AUDIT_CONFIG_KEY = 'audit-config';

export interface AuditConfig {
  /**
   * Resource name (e.g., 'product', 'transaction')
   * If not provided, will be extracted from URL
   */
  resource?: string;

  /**
   * Audit action type
   * If not provided, will be inferred from HTTP method
   */
  action?: AuditAction;

  /**
   * Fields to include in audit log
   * If not provided, entire request body is logged
   */
  fields?: string[];

  /**
   * Fields to exclude from audit log (for sensitive data)
   */
  excludeFields?: string[];

  /**
   * Custom metadata to add to audit log
   */
  metadata?: Record<string, any>;

  /**
   * Whether to log request body
   * Default: true
   */
  logBody?: boolean;

  /**
   * Whether to log response data
   * Default: true
   */
  logResponse?: boolean;
}

/**
 * Decorator to customize audit logging for specific endpoints
 * Provides granular control over what gets logged
 *
 * @example
 * ```typescript
 * @Audit({
 *   resource: 'product',
 *   action: 'CREATE',
 *   excludeFields: ['password', 'secret']
 * })
 * @Post()
 * async create(@Body() dto: CreateProductDto) {
 *   // Logged with custom config
 * }
 * ```
 */
export const Audit = (config: AuditConfig = {}) =>
  SetMetadata(AUDIT_CONFIG_KEY, config);
