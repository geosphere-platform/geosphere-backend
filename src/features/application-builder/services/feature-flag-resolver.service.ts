/**
 * Hierarchical Feature Flag Evaluation Engine
 * Hierarchy: Global -> Tenant -> Application -> Environment
 */

export class FeatureFlagResolverService {
  /**
   * Resolves effective feature flags by layering configs in priority order.
   */
  public resolveFeatureFlags(
    globalFlags: Record<string, boolean> = {},
    tenantFlags: Record<string, boolean> = {},
    appFlags: Record<string, boolean> = {},
    envFlags: Record<string, boolean> = {},
  ): Record<string, boolean> {
    return {
      // Default base flags
      LOCATION_TRACKING: true,
      OFFLINE_MODE: true,
      ADVANCED_GEOFENCE: false,
      MEDIA_UPLOAD: true,
      WORKFLOW_ENGINE: true,
      VECTOR_TILES: true,

      // Layer global -> tenant -> application -> environment overrides
      ...globalFlags,
      ...tenantFlags,
      ...appFlags,
      ...envFlags,
    };
  }
}

export const featureFlagResolverService = new FeatureFlagResolverService();
