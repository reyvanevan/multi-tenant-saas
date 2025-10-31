import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditLogs: AuditLogsService,
  ) {}

  async register(dto: RegisterDto, tenantId: string) {
    // Check if username or email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        username: dto.username,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      include: {
        role: true,
        tenant: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    // Find user by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.usernameOrEmail }, { email: dto.usernameOrEmail }],
      },
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

    if (!user) {
      // Log failed login attempt
      await this.auditLogs.log({
        tenantId: 'unknown', // No tenant context on failed login
        userId: 'unknown',
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: dto.usernameOrEmail,
        newValues: {
          reason: 'User not found',
          attemptedIdentifier: dto.usernameOrEmail,
        },
        ipAddress,
        userAgent,
        status: 'FAILED',
        errorMessage: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      // Log failed login attempt
      await this.auditLogs.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: user.id,
        newValues: {
          reason: 'Account inactive',
          username: user.username,
          email: user.email,
        },
        ipAddress,
        userAgent,
        status: 'FAILED',
        errorMessage: 'User account is inactive',
      });
      throw new UnauthorizedException('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      // Log failed login attempt
      await this.auditLogs.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: user.id,
        newValues: {
          reason: 'Invalid password',
          username: user.username,
          email: user.email,
        },
        ipAddress,
        userAgent,
        status: 'FAILED',
        errorMessage: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Extract permissions
    const permissions = user.role
      ? user.role.permissions.map((rp) => rp.permission.code)
      : [];

    // Log successful login
    await this.auditLogs.logLogin(
      user.tenantId,
      user.id,
      true,
      ipAddress,
      userAgent,
      {
        username: user.username,
        email: user.email,
        role: user.role?.name,
        outlet: user.outlet?.name,
      },
    );

    return {
      user: {
        ...this.sanitizeUser(user),
        permissions,
      },
      ...tokens,
    };
  }

  async refreshToken(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Verify refresh token exists and not revoked
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt) {
      // Log failed refresh attempt
      if (tokenRecord?.user) {
        await this.auditLogs.log({
          tenantId: tokenRecord.user.tenantId,
          userId: tokenRecord.user.id,
          action: 'LOGIN_FAILED',
          resource: 'auth',
          resourceId: tokenRecord.user.id,
          newValues: {
            reason: 'Invalid or revoked refresh token',
          },
          ipAddress,
          userAgent,
          status: 'FAILED',
          errorMessage: 'Invalid refresh token',
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenRecord.expiresAt) {
      // Log expired token
      await this.auditLogs.log({
        tenantId: tokenRecord.user.tenantId,
        userId: tokenRecord.user.id,
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: tokenRecord.user.id,
        newValues: {
          reason: 'Refresh token expired',
        },
        ipAddress,
        userAgent,
        status: 'FAILED',
        errorMessage: 'Refresh token expired',
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        tenant: true,
      },
    });

    const tokens = await this.generateTokens(user!);

    // Log successful token refresh
    await this.auditLogs.log({
      tenantId: user!.tenantId,
      userId: user!.id,
      action: 'LOGIN',
      resource: 'auth',
      resourceId: user!.id,
      newValues: {
        action: 'Token refresh',
        username: user!.username,
        email: user!.email,
      },
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return {
      user: this.sanitizeUser(user!),
      ...tokens,
    };
  }

  async logout(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get user info for audit log
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        username: true,
        email: true,
      },
    });

    // Revoke refresh token
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Log logout
    if (user) {
      await this.auditLogs.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGOUT',
        resource: 'auth',
        resourceId: user.id,
        newValues: {
          username: user.username,
          email: user.email,
        },
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      });
    }

    return { message: 'Logged out successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      // Log failed password change
      await this.auditLogs.log({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'PASSWORD_CHANGE',
        resource: 'auth',
        resourceId: user.id,
        newValues: {
          reason: 'Invalid current password',
        },
        ipAddress,
        userAgent,
        status: 'FAILED',
        errorMessage: 'Invalid current password',
      });
      throw new UnauthorizedException('Invalid current password');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Log successful password change
    await this.auditLogs.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PASSWORD_CHANGE',
      resource: 'auth',
      resourceId: user.id,
      newValues: {
        username: user.username,
        email: user.email,
      },
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload);

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  async getUserContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
        tenant: {
          include: {
            outlets: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
              },
            },
          },
        },
        outlet: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is superadmin by role name
    const isSuperadmin = user.role?.name === 'SUPERADMIN' || user.role?.name === 'SUPER_ADMIN';

    // Get all permissions
    const permissions = user.role?.permissions?.map(rp => rp.permission.action) || [];

    return {
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        email: user.email,
        avatar: user.avatar,
        isSuperadmin,
      },
      tenant: user.tenant ? {
        id: user.tenant.id,
        slug: user.tenant.slug,
        name: user.tenant.name,
        logo: user.tenant.logo,
        outlets: user.tenant.outlets,
      } : null,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        permissions,
      } : null,
      lastTenantId: user.lastTenantId,
      lastOutletId: user.lastOutletId,
      currentOutlet: user.outlet ? {
        id: user.outlet.id,
        name: user.outlet.name,
        code: user.outlet.code,
      } : null,
    };
  }

  async switchContext(
    userId: string,
    tenantId?: string,
    outletId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: {
            outlets: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Validate tenant access (if switching tenant)
    if (tenantId && tenantId !== user.tenantId) {
      throw new UnauthorizedException('You do not have access to this tenant');
    }

    // Validate outlet access (if switching outlet)
    if (outletId) {
      const outlet = await this.prisma.outlet.findFirst({
        where: {
          id: outletId,
          tenantId: user.tenantId,
          isActive: true,
        },
      });

      if (!outlet) {
        throw new UnauthorizedException('Outlet not found or inactive');
      }
    }

    // Update last context
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastTenantId: tenantId || user.tenantId,
        lastOutletId: outletId || null,
      },
    });

    // Log context switch
    await this.auditLogs.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'CONTEXT_SWITCHED',
      resource: 'auth',
      resourceId: user.id,
      newValues: {
        tenantId: tenantId || user.tenantId,
        outletId: outletId || null,
      },
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    });

    return { 
      success: true,
      message: 'Context switched successfully',
    };
  }
}
