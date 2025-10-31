import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../auth/decorators/public.decorator';

/**
 * Interceptor to extract and validate tenantId from JWT payload
 * Sets tenantId on request object for use in controllers and services
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip tenant validation for public routes
    if (isPublic) {
      return next.handle();
    }

    // Extract tenantId from authenticated user (set by JWT strategy)
    const user = request.user;

    if (!user) {
      // User should be set by JwtAuthGuard, if not something is wrong
      throw new BadRequestException('User not authenticated');
    }

    if (!user.tenantId) {
      throw new BadRequestException('Tenant ID not found in user context');
    }

    // Set tenantId on request for easy access
    request.tenantId = user.tenantId;

    // Optional: Also set outletId if present
    if (user.outletId) {
      request.outletId = user.outletId;
    }

    return next.handle();
  }
}
