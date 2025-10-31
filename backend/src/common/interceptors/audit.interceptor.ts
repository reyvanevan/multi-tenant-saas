import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { AuditAction } from '@prisma/client';
import { NO_AUDIT_KEY } from '../decorators/no-audit.decorator';
import { AUDIT_CONFIG_KEY, AuditConfig } from '../decorators/audit.decorator';

/**
 * Global interceptor that automatically logs HTTP requests
 * Can be disabled per endpoint using @NoAudit() decorator
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditLogs: AuditLogsService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if audit is disabled for this endpoint
    const noAudit = this.reflector.getAllAndOverride<boolean>(NO_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (noAudit) {
      return next.handle();
    }

    // Get custom audit config from decorator
    const auditConfig = this.reflector.getAllAndOverride<AuditConfig>(
      AUDIT_CONFIG_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, url, user, body, ip, headers } = request;
    const userAgent = headers['user-agent'];
    const tenantId = user?.tenantId;
    const userId = user?.userId;

    // Only audit if user is authenticated
    if (!userId || !tenantId) {
      return next.handle();
    }

    // Determine action from HTTP method or config
    const actionMap: Record<string, AuditAction> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    const action = auditConfig?.action || actionMap[method];

    // Skip if not a write operation
    if (!action) {
      return next.handle();
    }

    // Extract resource from URL or config
    const resourceMatch = url.match(/\/api\/v1\/([^\/\?]+)/);
    const resource =
      auditConfig?.resource || (resourceMatch ? resourceMatch[1] : 'unknown');

    // Skip auth endpoints (already manually logged)
    if (resource === 'auth' && !auditConfig) {
      return next.handle();
    }

    // Filter body based on config
    let bodyToLog = body;
    if (auditConfig?.logBody === false) {
      bodyToLog = undefined;
    } else if (auditConfig?.fields) {
      // Only include specified fields
      bodyToLog = auditConfig.fields.reduce((acc, field) => {
        if (body[field] !== undefined) {
          acc[field] = body[field];
        }
        return acc;
      }, {} as any);
    } else if (auditConfig?.excludeFields) {
      // Exclude sensitive fields
      bodyToLog = { ...body };
      auditConfig.excludeFields.forEach((field) => {
        delete bodyToLog[field];
      });
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          // Log successful operation
          const duration = Date.now() - startTime;

          // Try to extract resource ID from response
          const resourceId =
            responseData?.id ||
            responseData?.data?.id ||
            responseData?.outlet?.id ||
            responseData?.product?.id ||
            responseData?.transaction?.id;

          // Determine what to log based on config
          const shouldLogResponse = auditConfig?.logResponse !== false;

          this.auditLogs.log({
            tenantId,
            userId,
            action,
            resource,
            resourceId: resourceId || undefined,
            newValues: action === 'CREATE' ? bodyToLog : undefined,
            oldValues: action === 'DELETE' ? { deleted: true } : undefined,
            ipAddress: ip,
            userAgent,
            status: 'SUCCESS',
            metadata: {
              method,
              url,
              statusCode: response.statusCode,
              duration,
              ...(auditConfig?.metadata || {}),
              ...(shouldLogResponse && responseData
                ? { response: responseData }
                : {}),
            },
          });
        },
        error: (error) => {
          // Log failed operation
          this.auditLogs.log({
            tenantId,
            userId,
            action,
            resource,
            newValues: bodyToLog,
            ipAddress: ip,
            userAgent,
            status: 'FAILED',
            errorMessage: error.message,
            metadata: {
              method,
              url,
              statusCode: error.status || 500,
              ...(auditConfig?.metadata || {}),
            },
          });
        },
      }),
    );
  }
}
