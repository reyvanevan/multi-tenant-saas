import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_FEATURE_KEY,
  RequireFeatureOptions,
} from '../decorators/require-feature.decorator';
import { FeatureFlagsService } from '../../feature-flags/feature-flags.service';

/**
 * Guard to check if a feature is enabled for the tenant
 * Works with @RequireFeature() decorator
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagsService: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get feature requirement from decorator
    const featureOptions =
      this.reflector.getAllAndOverride<RequireFeatureOptions>(
        REQUIRE_FEATURE_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!featureOptions) {
      // No feature requirement, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, can't check tenant features
    if (!user || !user.tenantId) {
      throw new ForbiddenException(
        featureOptions.message || 'Feature not available',
      );
    }

    // Check if feature is enabled for tenant
    const result = await this.featureFlagsService.isEnabled(
      user.tenantId,
      featureOptions.feature,
    );

    if (!result.enabled) {
      throw new ForbiddenException(
        featureOptions.message ||
          result.reason ||
          `Feature '${featureOptions.feature}' is not available`,
      );
    }

    // Store feature config in request for controller use
    request.featureConfig = result.config;

    return true;
  }
}
