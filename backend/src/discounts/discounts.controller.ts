import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, UpdateDiscountDto, ApplyDiscountDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions as Permissions } from '../auth/decorators/require-permissions.decorator';

@ApiTags('Discounts')
@ApiBearerAuth()
@Controller('discounts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @Permissions('discounts.create.outlet')
  @ApiOperation({ summary: 'Create new discount/promo' })
  create(@Req() req: any, @Body() createDiscountDto: CreateDiscountDto) {
    return this.discountsService.create(
      req.user.tenantId,
      createDiscountDto,
      req.user.userId,
    );
  }

  @Get()
  @Permissions('discounts.read.outlet')
  @ApiOperation({ summary: 'Get all discounts' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  findAll(
    @Req() req: any,
    @Query('isActive') isActive?: string,
    @Query('type') type?: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.discountsService.findAll(req.user.tenantId, {
      isActive: isActive ? isActive === 'true' : undefined,
      type,
      outletId,
    });
  }

  @Get(':id')
  @Permissions('discounts.read.outlet')
  @ApiOperation({ summary: 'Get discount by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.discountsService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @Permissions('discounts.update.outlet')
  @ApiOperation({ summary: 'Update discount' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountsService.update(
      req.user.tenantId,
      id,
      updateDiscountDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @Permissions('discounts.delete.outlet')
  @ApiOperation({ summary: 'Delete discount' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.discountsService.remove(req.user.tenantId, id, req.user.userId);
  }

  @Post('calculate')
  @Permissions('discounts.read.outlet')
  @ApiOperation({ summary: 'Calculate applicable discounts for cart' })
  calculate(@Req() req: any, @Body() applyDiscountDto: ApplyDiscountDto) {
    return this.discountsService.calculateDiscounts(
      req.user.tenantId,
      applyDiscountDto,
    );
  }

  @Get(':id/stats')
  @Permissions('discounts.read.outlet')
  @ApiOperation({ summary: 'Get discount usage statistics' })
  getStats(@Req() req: any, @Param('id') id: string) {
    return this.discountsService.getUsageStats(req.user.tenantId, id);
  }
}
