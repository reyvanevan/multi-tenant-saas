import { SetMetadata } from '@nestjs/common';

export const NO_AUDIT_KEY = 'no-audit';

/**
 * Decorator to disable audit logging for specific endpoints
 * Use this when audit is already handled manually or not needed
 *
 * @example
 * ```typescript
 * @NoAudit()
 * @Get()
 * async findAll() {
 *   // This endpoint won't be automatically audited
 * }
 * ```
 */
export const NoAudit = () => SetMetadata(NO_AUDIT_KEY, true);
