import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { TenantId } from '../common/decorators/tenant.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('outlets')
@ApiBearerAuth('JWT-auth')
@Controller('outlets')
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Post()
  @RequirePermissions('outlets.create.tenant')
  @ApiOperation({ summary: 'Create new outlet' })
  @ApiResponse({ status: 201, description: 'Outlet created successfully' })
  @ApiResponse({ status: 409, description: 'Outlet code already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(
    @TenantId() tenantId: string,
    @Body() dto: CreateOutletDto,
    @Request() req: any,
  ) {
    return this.outletsService.create(tenantId, req.user.userId, dto);
  }

  @Get()
  @RequirePermissions('outlets.read.tenant')
  @ApiOperation({ summary: 'Get all outlets in tenant' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive outlets',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of outlets',
    schema: {
      example: {
        tenantId: 'uuid',
        count: 2,
        outlets: [
          {
            id: 'uuid',
            name: 'Main Store',
            code: 'MAIN',
            type: 'RETAIL',
            isActive: true,
            city: 'Jakarta',
          },
        ],
      },
    },
  })
  findAll(
    @TenantId() tenantId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.outletsService.findAll(tenantId, includeInactive);
  }

  @Get(':id')
  @RequirePermissions('outlets.read.tenant')
  @ApiOperation({ summary: 'Get outlet by ID' })
  @ApiParam({ name: 'id', description: 'Outlet ID' })
  @ApiResponse({ status: 200, description: 'Outlet details' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.outletsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('outlets.update.tenant')
  @ApiOperation({ summary: 'Update outlet' })
  @ApiParam({ name: 'id', description: 'Outlet ID' })
  @ApiResponse({ status: 200, description: 'Outlet updated successfully' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  @ApiResponse({ status: 409, description: 'Outlet code already exists' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOutletDto,
    @Request() req: any,
  ) {
    return this.outletsService.update(tenantId, req.user.userId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('outlets.delete.tenant')
  @ApiOperation({ summary: 'Delete outlet' })
  @ApiParam({ name: 'id', description: 'Outlet ID' })
  @ApiResponse({ status: 200, description: 'Outlet deleted successfully' })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete outlet with existing data',
  })
  remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.outletsService.remove(tenantId, req.user.userId, id);
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('outlets.update.tenant')
  @ApiOperation({ summary: 'Toggle outlet active status' })
  @ApiParam({ name: 'id', description: 'Outlet ID' })
  @ApiResponse({
    status: 200,
    description: 'Outlet status toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'Outlet not found' })
  toggleActive(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.outletsService.toggleActive(tenantId, id);
  }
}
