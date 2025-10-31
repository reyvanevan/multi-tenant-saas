import { Controller, Get, Post, Delete } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';

interface UserPayload {
  userId: string;
  username: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
  tenantId: string;
}

@Controller('test')
export class TestController {
  // Any authenticated user can access
  @Get('basic')
  basicAccess(@CurrentUser() user: UserPayload) {
    return {
      message: 'This endpoint requires authentication only',
      user: {
        username: user.username,
        role: user.role.name,
        permissions: user.permissions,
      },
    };
  }

  // Requires specific permissions
  @RequirePermissions('users.read')
  @Get('users-read')
  usersReadAccess(@CurrentUser() user: UserPayload) {
    return {
      message: 'You have users.read permission',
      user: {
        username: user.username,
        permissions: user.permissions,
      },
    };
  }

  // Requires multiple permissions
  @RequirePermissions('users.create', 'users.update')
  @Post('users-create')
  usersCreateAccess(@CurrentUser() user: UserPayload) {
    return {
      message: 'You have users.create AND users.update permissions',
      user: {
        username: user.username,
        permissions: user.permissions,
      },
    };
  }

  // Requires specific role
  @RequireRoles('SUPER_ADMIN', 'ADMIN')
  @Get('admin-only')
  adminOnlyAccess(@CurrentUser() user: UserPayload) {
    return {
      message: 'This endpoint is for SUPER_ADMIN or ADMIN only',
      user: {
        username: user.username,
        role: user.role.name,
      },
    };
  }

  // Requires both role and permissions
  @RequireRoles('SUPER_ADMIN')
  @RequirePermissions('system.delete')
  @Delete('super-admin-delete')
  superAdminDelete(@CurrentUser() user: UserPayload) {
    return {
      message: 'You are SUPER_ADMIN with system.delete permission',
      user: {
        username: user.username,
        role: user.role.name,
        permissions: user.permissions,
      },
    };
  }
}
