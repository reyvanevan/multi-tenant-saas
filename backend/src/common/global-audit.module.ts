import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

/**
 * Example of how to enable global audit interceptor
 *
 * To use:
 * 1. Import this module in AppModule
 * 2. All write operations (POST/PUT/PATCH/DELETE) will be auto-audited
 * 3. Use @NoAudit() to disable audit for specific endpoints
 * 4. Use @Audit() to customize audit behavior
 */
@Module({
  imports: [AuditLogsModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class GlobalAuditModule {}
