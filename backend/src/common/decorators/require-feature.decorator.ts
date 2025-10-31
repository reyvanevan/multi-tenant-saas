import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FEATURE_KEY = 'requireFeature';

export interface RequireFeatureOptions {
  /** Feature key to check */
  feature: string;
  /** Custom error message when feature is disabled */
  message?: string;
  /** Redirect URL when feature is disabled (for UI) */
  redirectUrl?: string;
}

/**
 * Decorator to require a feature flag to be enabled for the tenant
 *
 * @example
 * ```ts
 * @RequireFeature({ feature: 'kds' })
 * @Get('/kds')
 * getKdsData() {
 *   // This endpoint only accessible if 'kds' feature is enabled for the tenant
 * }
 * ```
 *
 * @example With custom message
 * ```ts
 * @RequireFeature({
 *   feature: 'offline_pos',
 *   message: 'Offline POS requires Business plan or higher'
 * })
 * ```
 */
export const RequireFeature = (options: RequireFeatureOptions) =>
  SetMetadata(REQUIRE_FEATURE_KEY, options);
