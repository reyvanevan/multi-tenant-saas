import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { TenantPrismaService } from '../common/services/tenant-prisma.service';

interface UserPayload {
  userId: string;
  username: string;
  tenantId: string;
  outletId?: string;
}

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private tenantPrisma: TenantPrismaService) {}

  /**
   * Get all users in current tenant
   * Automatically filtered by tenantId from JWT
   */
  @RequirePermissions('users.read.outlet')
  @Get()
  @ApiOperation({ summary: 'Get all users in tenant' })
  @ApiResponse({
    status: 200,
    description: 'List of users in tenant',
    schema: {
      example: {
        tenantId: 'uuid',
        currentUser: 'admin',
        count: 3,
        users: [
          {
            id: 'uuid',
            username: 'john_doe',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            isActive: true,
            role: { id: 'role-uuid', name: 'ADMIN' },
            outlet: { id: 'outlet-uuid', name: 'Main Store' },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: UserPayload,
  ) {
    // Use tenant-scoped Prisma
    const db = this.tenantPrisma.forTenant(tenantId);

    const users = await db.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      tenantId,
      currentUser: user.username,
      count: users.length,
      users,
    };
  }

  /**
   * Get user by ID (tenant-scoped)
   */
  @RequirePermissions('users.read.outlet')
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found in tenant' })
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    const db = this.tenantPrisma.forTenant(tenantId);

    const user = await db.user.findUnique({
      where: { id },
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
        outlet: true,
      },
    });

    if (!user) {
      return { error: 'User not found in your tenant' };
    }

    return { tenantId, user };
  }

  /**
   * Create new user in current tenant
   */
  @RequirePermissions('users.create.outlet')
  @Post()
  async create(
    @TenantId() tenantId: string,
    @Body() createUserDto: any,
    @CurrentUser() user: UserPayload,
  ) {
    const db = this.tenantPrisma.forTenant(tenantId);

    // tenantId will be automatically added by tenant-scoped client
    const newUser = await db.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        passwordHash: 'hashed_password', // TODO: hash properly
        roleId: createUserDto.roleId,
        outletId: user.outletId, // Assign to current user's outlet
      },
      include: {
        role: true,
        outlet: true,
      },
    });

    return {
      message: 'User created successfully',
      tenantId,
      user: newUser,
    };
  }

  /**
   * Get outlets in current tenant
   */
  @RequirePermissions('users.read.outlet')
  @Get('outlets/list')
  async getOutlets(@TenantId() tenantId: string) {
    const db = this.tenantPrisma.forTenant(tenantId);

    const outlets = await db.outlet.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        isActive: true,
      },
    });

    return {
      tenantId,
      count: outlets.length,
      outlets,
    };
  }

  /**
   * Get roles in current tenant
   */
  @RequirePermissions('roles.read.tenant')
  @Get('roles/list')
  async getRoles(@TenantId() tenantId: string) {
    const db = this.tenantPrisma.forTenant(tenantId);

    const roles = await db.role.findMany({
      include: {
        permissions: {
          include: {
            permission: {
              select: {
                code: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return {
      tenantId,
      count: roles.length,
      roles,
    };
  }
}
