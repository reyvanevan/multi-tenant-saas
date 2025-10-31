import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // userId
  username: string;
  email: string;
  tenantId: string;
  roleId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        tenant: true,
        outlet: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Extract permissions
    const permissions = user.role
      ? user.role.permissions.map((rp) => rp.permission.code)
      : [];

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      tenantId: user.tenantId,
      tenant: user.tenant,
      roleId: user.roleId,
      role: user.role,
      permissions,
      outletId: user.outletId,
      outlet: user.outlet,
    };
  }
}
