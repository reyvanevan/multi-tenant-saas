import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureFlag, TenantEntitlement } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

interface FeatureCheckResult {
  enabled: boolean;
  reason?: string;
  config?: any;
}

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Check if a feature is enabled for a tenant
   * Considers: global flag, plan access, rollout percentage, tenant-specific config
   */
  async isEnabled(
    tenantId: string,
    featureKey: string,
  ): Promise<FeatureCheckResult> {
    // Try cache first
    const cacheKey = `feature:${tenantId}:${featureKey}`;
    const cached = await this.cacheManager.get<FeatureCheckResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get feature flag
      const feature = await this.getFeatureFlag(featureKey);
      if (!feature) {
        return {
          enabled: false,
          reason: 'Feature not found',
        };
      }

      // Check if globally disabled
      if (!feature.enabled) {
        return this.cacheResult(cacheKey, {
          enabled: false,
          reason: 'Feature globally disabled',
        });
      }

      // Get tenant with subscription info
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          plan: true,
        },
      });

      if (!tenant) {
        return {
          enabled: false,
          reason: 'Tenant not found',
        };
      }

      // Check plan access
      if (
        feature.plans.length > 0 &&
        !feature.plans.includes(tenant.plan?.code || '')
      ) {
        return this.cacheResult(cacheKey, {
          enabled: false,
          reason: 'Feature not available in current plan',
        });
      }

      // Check rollout (gradual release)
      if (feature.rolloutPercentage < 100) {
        // Check if tenant is in explicit rollout list
        if (!feature.rolloutTenants.includes(tenantId)) {
          // Use hash-based rollout
          const hash = this.hashTenantId(tenantId);
          const isInRollout = hash % 100 < feature.rolloutPercentage;
          if (!isInRollout) {
            return this.cacheResult(cacheKey, {
              enabled: false,
              reason: 'Tenant not in rollout percentage',
            });
          }
        }
      }

      // Check tenant-specific entitlement
      const entitlement = await this.prisma.tenantEntitlement.findUnique({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey,
          },
        },
      });

      // If explicitly disabled for tenant
      if (entitlement && !entitlement.enabled) {
        return this.cacheResult(cacheKey, {
          enabled: false,
          reason: 'Feature disabled for tenant',
        });
      }

      // Feature is enabled!
      return this.cacheResult(cacheKey, {
        enabled: true,
        config: entitlement?.config || feature.metadata,
      });
    } catch (error) {
      this.logger.error(
        `Error checking feature ${featureKey} for tenant ${tenantId}`,
        error,
      );
      // Fail open - allow access on error
      return { enabled: true };
    }
  }

  /**
   * Get feature flag by key
   */
  async getFeatureFlag(featureKey: string): Promise<FeatureFlag | null> {
    const cacheKey = `feature-flag:${featureKey}`;
    let feature = await this.cacheManager.get<FeatureFlag>(cacheKey);

    if (!feature) {
      feature =
        (await this.prisma.featureFlag.findUnique({
          where: { key: featureKey },
        })) || undefined;
      if (feature) {
        await this.cacheManager.set(cacheKey, feature, 300000); // 5 min
      }
    }

    return feature || null;
  }

  /**
   * Get all enabled features for a tenant
   */
  async getTenantFeatures(tenantId: string): Promise<string[]> {
    const cacheKey = `tenant-features:${tenantId}`;
    const cached = await this.cacheManager.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get all features
      const allFeatures = await this.prisma.featureFlag.findMany({
        where: { enabled: true },
      });

      const enabledFeatures: string[] = [];
      for (const feature of allFeatures) {
        const result = await this.isEnabled(tenantId, feature.key);
        if (result.enabled) {
          enabledFeatures.push(feature.key);
        }
      }

      // Cache for 5 minutes
      await this.cacheManager.set(cacheKey, enabledFeatures, 300000);
      return enabledFeatures;
    } catch (error) {
      this.logger.error(`Error getting features for tenant ${tenantId}`, error);
      return [];
    }
  }

  /**
   * Override feature for specific tenant
   */
  async overrideFeature(
    tenantId: string,
    featureKey: string,
    enabled: boolean,
    config?: any,
  ): Promise<TenantEntitlement> {
    const entitlement = await this.prisma.tenantEntitlement.upsert({
      where: {
        tenantId_featureKey: {
          tenantId,
          featureKey,
        },
      },
      create: {
        tenantId,
        featureKey,
        enabled,
        config,
      },
      update: {
        enabled,
        config,
      },
    });

    // Invalidate cache
    await this.invalidateFeatureCache(tenantId, featureKey);

    this.logger.log(
      `Feature ${featureKey} ${enabled ? 'enabled' : 'disabled'} for tenant ${tenantId}`,
    );

    return entitlement;
  }

  /**
   * Bulk enable features for tenant (useful for plan upgrades)
   */
  async enableFeaturesForTenant(
    tenantId: string,
    featureKeys: string[],
  ): Promise<void> {
    await this.prisma.$transaction(
      featureKeys.map((featureKey) =>
        this.prisma.tenantEntitlement.upsert({
          where: {
            tenantId_featureKey: {
              tenantId,
              featureKey,
            },
          },
          create: {
            tenantId,
            featureKey,
            enabled: true,
          },
          update: {
            enabled: true,
          },
        }),
      ),
    );

    // Invalidate cache
    await this.cacheManager.del(`tenant-features:${tenantId}`);
    this.logger.log(
      `Enabled ${featureKeys.length} features for tenant ${tenantId}`,
    );
  }

  /**
   * Check if feature is available in a plan
   */
  async checkPlanAccess(plan: string, featureKey: string): Promise<boolean> {
    const feature = await this.getFeatureFlag(featureKey);
    if (!feature) return false;
    if (feature.plans.length === 0) return true; // Available to all
    return feature.plans.includes(plan);
  }

  /**
   * Get all features available in a plan
   */
  async getPlanFeatures(planCode: string): Promise<FeatureFlag[]> {
    return this.prisma.featureFlag.findMany({
      where: {
        enabled: true,
        OR: [{ plans: { has: planCode } }, { plans: { isEmpty: true } }],
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Admin: Create or update feature flag
   */
  async upsertFeatureFlag(data: {
    key: string;
    name: string;
    description?: string;
    category?: string;
    enabled?: boolean;
    plans?: string[];
    rolloutPercentage?: number;
    rolloutTenants?: string[];
    metadata?: any;
  }): Promise<FeatureFlag> {
    const feature = await this.prisma.featureFlag.upsert({
      where: { key: data.key },
      create: {
        key: data.key,
        name: data.name,
        description: data.description,
        category: data.category,
        enabled: data.enabled ?? true,
        plans: data.plans ?? [],
        rolloutPercentage: data.rolloutPercentage ?? 100,
        rolloutTenants: data.rolloutTenants ?? [],
        metadata: data.metadata,
      },
      update: {
        name: data.name,
        description: data.description,
        category: data.category,
        enabled: data.enabled,
        plans: data.plans,
        rolloutPercentage: data.rolloutPercentage,
        rolloutTenants: data.rolloutTenants,
        metadata: data.metadata,
      },
    });

    // Invalidate cache
    await this.cacheManager.del(`feature-flag:${data.key}`);
    this.logger.log(`Feature flag ${data.key} upserted`);

    return feature;
  }

  /**
   * Admin: Delete feature flag
   */
  async deleteFeatureFlag(featureKey: string): Promise<void> {
    await this.prisma.featureFlag.delete({
      where: { key: featureKey },
    });
    await this.cacheManager.del(`feature-flag:${featureKey}`);
    this.logger.log(`Feature flag ${featureKey} deleted`);
  }

  /**
   * Helper: Hash tenant ID for consistent rollout
   */
  private hashTenantId(tenantId: string): number {
    let hash = 0;
    for (let i = 0; i < tenantId.length; i++) {
      const char = tenantId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Helper: Cache result with TTL
   */
  private async cacheResult(
    key: string,
    result: FeatureCheckResult,
  ): Promise<FeatureCheckResult> {
    await this.cacheManager.set(key, result, 300000); // 5 min
    return result;
  }

  /**
   * Helper: Invalidate feature cache
   */
  private async invalidateFeatureCache(
    tenantId: string,
    featureKey: string,
  ): Promise<void> {
    await this.cacheManager.del(`feature:${tenantId}:${featureKey}`);
    await this.cacheManager.del(`tenant-features:${tenantId}`);
  }
}
