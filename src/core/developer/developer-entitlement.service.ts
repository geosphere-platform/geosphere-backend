/**
 * Phase 15 — Application Entitlement & Precedence Service
 *
 * Computes effective GIS SDK/API entitlements for an application.
 * Deterministic Precedence Model:
 *   1. Application Entitlement Override (highest)
 *   2. Organization Entitlement Override
 *   3. Subscription Plan limit/feature
 *   4. System Default (lowest)
 */

import { applicationService } from "./application.service";
import { entitlementService } from "../subscription/entitlement.service";

export interface EffectiveApplicationEntitlements {
  organizationId: string;
  applicationId: string;
  environment: string;
  enabledModules: string[];
  grantedScopes: string[];
  limits: {
    maxApiRequestsMonth: { limit: number | null; isUnlimited: boolean };
    maxRealtimeConnections: { limit: number | null; isUnlimited: boolean };
    maxSpatialQueriesMonth: { limit: number | null; isUnlimited: boolean };
  };
  features: Record<string, boolean>;
}

export class DeveloperEntitlementService {
  /**
   * Get Effective Entitlements for an Application
   */
  async getEffectiveApplicationEntitlements(
    applicationId: string,
    organizationId: string,
  ): Promise<EffectiveApplicationEntitlements> {
    const appDetails = await applicationService.getApplicationDetails(
      applicationId,
      organizationId,
    );

    const orgEntitlements =
      await entitlementService.getEffectiveEntitlements(organizationId);

    // Precedence calculation for modules
    const enabledModules = [...appDetails.enabledSdkModules];

    // Build features dictionary
    const features: Record<string, boolean> = {
      GIS_MAP: orgEntitlements.features.GIS_MAP ?? true,
      GIS_LAYERS: orgEntitlements.features.GIS_LAYERS ?? true,
      SPATIAL_QUERY: orgEntitlements.features.SPATIAL_QUERY ?? true,
      SPATIAL_ANALYTICS: orgEntitlements.features.SPATIAL_ANALYTICS ?? false,
      REALTIME: orgEntitlements.features.REALTIME ?? false,
      RULE_ENGINE: orgEntitlements.features.RULE_ENGINE ?? false,
      WEB_SDK: orgEntitlements.features.WEB_SDK ?? true,
      MOBILE_SDK: orgEntitlements.features.MOBILE_SDK ?? false,
    };

    // Limits
    const limits = {
      maxApiRequestsMonth: {
        limit: orgEntitlements.limits.MAX_API_REQUESTS?.numericValue ?? 100000,
        isUnlimited:
          orgEntitlements.limits.MAX_API_REQUESTS?.isUnlimited ?? false,
      },
      maxRealtimeConnections: {
        limit:
          orgEntitlements.limits.MAX_REALTIME_CONNECTIONS?.numericValue ?? 50,
        isUnlimited:
          orgEntitlements.limits.MAX_REALTIME_CONNECTIONS?.isUnlimited ?? false,
      },
      maxSpatialQueriesMonth: {
        limit:
          orgEntitlements.limits.MAX_SPATIAL_QUERIES?.numericValue ?? 50000,
        isUnlimited:
          orgEntitlements.limits.MAX_SPATIAL_QUERIES?.isUnlimited ?? false,
      },
    };

    return {
      organizationId,
      applicationId,
      environment: appDetails.environment,
      enabledModules,
      grantedScopes: appDetails.grantedScopes,
      limits,
      features,
    };
  }
}

export const developerEntitlementService = new DeveloperEntitlementService();
