import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip for public routes
    const publicPaths = ['/auth/login', '/auth/register', '/auth/refresh', '/health'];
    if (publicPaths.some(path => req.path.includes(path))) {
      return next();
    }

    // Get user from request (set by JWT guard)
    const user = (req as any).user;
    if (!user || !user.tenantId) {
      return next();
    }

    // Check tenant subscription status
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        plan: true,
      },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    // Check if tenant is suspended or expired
    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenException('Your subscription is suspended. Please update your payment method.');
    }

    if (tenant.status === 'EXPIRED') {
      throw new ForbiddenException('Your subscription has expired. Please renew to continue.');
    }

    // Check if plan is expired
    if (tenant.planExpiry && new Date(tenant.planExpiry) < new Date()) {
      throw new ForbiddenException('Your subscription has expired. Please renew to continue.');
    }

    next();
  }
}
