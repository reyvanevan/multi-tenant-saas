import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  OverrideFeatureDto,
} from './dto';

@ApiTags('Feature Flags')
@ApiBearerAuth()
@Controller({ path: 'feature-flags', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get('check/:featureKey')
  @ApiOperation({ summary: 'Check if feature is enabled for current tenant' })
  @ApiResponse({ status: 200, description: 'Feature check result' })
  async checkFeature(
    @CurrentUser() user: { tenantId: string },
    @Param('featureKey') featureKey: string,
  ) {
    const result = await this.featureFlagsService.isEnabled(
      user.tenantId,
      featureKey,
    );
    return {
      featureKey,
      enabled: result.enabled,
      reason: result.reason,
      config: result.config,
    };
  }

  @Get('my-features')
  @ApiOperation({ summary: 'Get all enabled features for current tenant' })
  @ApiResponse({ status: 200, description: 'List of enabled features' })
  async getMyFeatures(@CurrentUser() user: { tenantId: string }) {
    const features = await this.featureFlagsService.getTenantFeatures(
      user.tenantId,
    );
    return { features };
  }

  @Get('plan/:planCode')
  @RequirePermissions('view_plan_features')
  @ApiOperation({ summary: 'Get all features available in a plan' })
  @ApiResponse({ status: 200, description: 'List of plan features' })
  async getPlanFeatures(@Param('planCode') planCode: string) {
    const features = await this.featureFlagsService.getPlanFeatures(planCode);
    return { features };
  }

  @Get()
  @RequirePermissions('view_feature_flags')
  @ApiOperation({ summary: 'List all feature flags (Admin)' })
  @ApiResponse({ status: 200, description: 'List of all feature flags' })
  listFeatureFlags() {
    // This would need pagination in real app
    return { message: 'List endpoint - TODO: implement query filters' };
  }

  @Post()
  @RequirePermissions('manage_feature_flags')
  @ApiOperation({ summary: 'Create feature flag (Admin)' })
  @ApiResponse({ status: 201, description: 'Feature flag created' })
  async createFeatureFlag(@Body() dto: CreateFeatureFlagDto) {
    const feature = await this.featureFlagsService.upsertFeatureFlag(dto);
    return { feature };
  }

  @Put(':featureKey')
  @RequirePermissions('manage_feature_flags')
  @ApiOperation({ summary: 'Update feature flag (Admin)' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  async updateFeatureFlag(
    @Param('featureKey') featureKey: string,
    @Body() dto: UpdateFeatureFlagDto,
  ) {
    const feature = await this.featureFlagsService.upsertFeatureFlag({
      key: featureKey,
      name: dto.name || '', // Provide default or fetch existing
      ...dto,
    });
    return { feature };
  }

  @Delete(':featureKey')
  @RequirePermissions('manage_feature_flags')
  @ApiOperation({ summary: 'Delete feature flag (Admin)' })
  @ApiResponse({ status: 200, description: 'Feature flag deleted' })
  async deleteFeatureFlag(@Param('featureKey') featureKey: string) {
    await this.featureFlagsService.deleteFeatureFlag(featureKey);
    return { message: 'Feature flag deleted' };
  }

  @Post('tenant/:tenantId/override')
  @RequirePermissions('manage_tenant_features')
  @ApiOperation({ summary: 'Override feature for tenant (Admin)' })
  @ApiResponse({ status: 200, description: 'Feature override applied' })
  async overrideFeature(
    @Param('tenantId') tenantId: string,
    @Body() dto: OverrideFeatureDto,
  ) {
    const entitlement = await this.featureFlagsService.overrideFeature(
      tenantId,
      dto.featureKey,
      dto.enabled,
      dto.config,
    );
    return { entitlement };
  }

  @Post('tenant/:tenantId/bulk-enable')
  @RequirePermissions('manage_tenant_features')
  @ApiOperation({ summary: 'Enable multiple features for tenant (Admin)' })
  @ApiResponse({ status: 200, description: 'Features enabled' })
  async bulkEnableFeatures(
    @Param('tenantId') tenantId: string,
    @Body('featureKeys') featureKeys: string[],
  ) {
    await this.featureFlagsService.enableFeaturesForTenant(
      tenantId,
      featureKeys,
    );
    return { message: `Enabled ${featureKeys.length} features` };
  }
}
