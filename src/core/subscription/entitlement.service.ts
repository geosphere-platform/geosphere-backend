/**
 * Phase 13 — EntitlementService
 *
 * Central entitlement resolution engine for the GIS SaaS platform.
 *
 * ARCHITECTURE RULE: No module (GIS Core, PostGIS, Map SDK, Realtime, Rules Engine)
 * should independently calculate plan permissions. All entitlement resolution
 * flows through this service.
 *
 * Authorization pipeline position:
 *   Request → Authentication → Tenant Context → RBAC → [THIS SERVICE] → Business Service
 *
 * RBAC vs Entitlements:
 *   RBAC:         "Is this USER allowed to perform this action?"
 *   Entitlements: "Does this ORGANIZATION have access to this capability?"
 *   Both checks are required and independent.
 *
 * Entitlement resolution algorithm:
 *   1. Load active subscription for org (TRIALING or ACTIVE, check timestamps)
 *   2. Load plan features & limits
 *   3. Load org overrides (take precedence over plan)
 *   4. Derive current usage from source tables (for resource counts)
 *   5. Return structured EffectiveEntitlements
 *
 * Override priority (highest to lowest):
 *   1. Organization Override (organizationEntitlementOverridesTable)
 *   2. Subscription Plan (planFeaturesTable + planLimitsTable)
 *   3. Default system config (DEFAULT_PLAN_CODE)
 *
 * Platform admin policy:
 *   Platform admins (PLATFORM_ADMIN / SUPER_ADMIN) bypass entitlement checks.
 *   This is consistent with how they bypass tenant isolation.
 *
 * Default on no subscription:
 *   Organizations with no active subscription are treated as FREE plan limits.
 *   Configurable via DEFAULT_PLAN_CODE constant below.
 *
 * Caching preparation:
 *   This service uses a single entry point `getEffectiveEntitlements()`.
 *   Future caching can wrap this method without changing callers.
 */

import { db } from "../../database";
import { TenantMemoryStore } from "../tenant/tenant-memory-store";
import {
  plansTable,
  planFeaturesTable,
  planLimitsTable,
  subscriptionsTable,
  organizationEntitlementOverridesTable,
  organizationMembershipsTable,
  workspacesTable,
  SUBSCRIPTION_STATUS,
  ACTIVE_SUBSCRIPTION_STATUSES,
  OVERRIDE_TYPE,
} from "../../database/schema";
import { eq, and, inArray, sum, count } from "drizzle-orm";
import { usageService } from "./usage.service";
import type {
  EffectiveEntitlements,
  EffectiveLimit,
  EntitlementCheckResult,
  LimitCheckResult,
  EntitlementDenialReason,
  SubscriptionStatus,
} from "./types";
import { LIMIT_METRIC, USAGE_METRIC } from "./types";

/** Default plan code for organizations with no active subscription */
const DEFAULT_PLAN_CODE = "FREE";

/** Roles that bypass entitlement checks (consistent with tenant isolation bypass) */
const PLATFORM_ADMIN_ROLES = ["PLATFORM_ADMIN", "SUPER_ADMIN"];

export class EntitlementService {
  /**
   * Returns whether a specific role should bypass entitlement checks.
   * Platform admins have platform-level access regardless of plan.
   */
  isPlatformAdmin(role: string): boolean {
    return PLATFORM_ADMIN_ROLES.includes(role);
  }

  /**
   * Resolves the complete effective entitlements for an organization.
   *
   * This is the central algorithm — no other module should replicate this logic.
   * Future caching can be added by wrapping this method.
   *
   * @param organizationId - The tenant organization ID
   * @returns EffectiveEntitlements snapshot
   */
  async getEffectiveEntitlements(
    organizationId: string,
  ): Promise<EffectiveEntitlements> {
    try {
      return await this.resolveDbEffectiveEntitlements(organizationId);
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        return this.getMemoryFallbackEntitlements(organizationId);
      }
      throw err;
    }
  }

  private async resolveDbEffectiveEntitlements(
    organizationId: string,
  ): Promise<EffectiveEntitlements> {
    const now = new Date();

    // 1. Load active subscription
    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.organizationId, organizationId),
          inArray(subscriptionsTable.status, ACTIVE_SUBSCRIPTION_STATUSES),
        ),
      )
      .limit(1);

    // Determine effective subscription status (accounting for trial/expiry)
    let effectiveStatus: SubscriptionStatus | "NO_SUBSCRIPTION" =
      "NO_SUBSCRIPTION";
    let planId: string | null = subscription?.planId ?? null;

    if (subscription) {
      effectiveStatus = this.resolveSubscriptionStatus(subscription, now);
    }

    // 2. Load plan entity (or default plan if no subscription)
    let planRow = null;
    if (planId) {
      [planRow] = await db
        .select()
        .from(plansTable)
        .where(eq(plansTable.id, planId))
        .limit(1);
    } else {
      const [defaultPlan] = await db
        .select()
        .from(plansTable)
        .where(eq(plansTable.code, DEFAULT_PLAN_CODE))
        .limit(1);
      if (defaultPlan) {
        planRow = defaultPlan;
        planId = defaultPlan.id;
      }
    }

    // Load plan features, limits, and org overrides in parallel
    const [planFeatures, planLimits, overrides] = await Promise.all([
      planId
        ? db
            .select({
              featureCode: planFeaturesTable.featureCode,
              isEnabled: planFeaturesTable.isEnabled,
            })
            .from(planFeaturesTable)
            .where(eq(planFeaturesTable.planId, planId))
        : [],
      planId
        ? db
            .select({
              metricCode: planLimitsTable.metricCode,
              numericValue: planLimitsTable.numericValue,
              isUnlimited: planLimitsTable.isUnlimited,
            })
            .from(planLimitsTable)
            .where(eq(planLimitsTable.planId, planId))
        : [],
      db
        .select()
        .from(organizationEntitlementOverridesTable)
        .where(
          eq(
            organizationEntitlementOverridesTable.organizationId,
            organizationId,
          ),
        ),
    ]);

    // 3. Compute effective features map (overrides take priority)
    const features: Record<string, boolean> = {};

    for (const pf of planFeatures) {
      features[pf.featureCode] = pf.isEnabled;
    }

    for (const override of overrides) {
      if (override.overrideType === OVERRIDE_TYPE.FEATURE_ENABLE) {
        features[override.resourceCode] = true;
      } else if (override.overrideType === OVERRIDE_TYPE.FEATURE_DISABLE) {
        features[override.resourceCode] = false;
      }
    }

    // 4. Compute effective limits map (overrides take priority)
    const limits: Record<string, EffectiveLimit> = {};

    for (const pl of planLimits) {
      limits[pl.metricCode] = {
        metricCode: pl.metricCode,
        numericValue: pl.numericValue,
        isUnlimited: pl.isUnlimited,
        source: "plan",
      };
    }

    for (const override of overrides) {
      if (override.overrideType === OVERRIDE_TYPE.LIMIT) {
        limits[override.resourceCode] = {
          metricCode: override.resourceCode,
          numericValue: override.numericValue,
          isUnlimited: override.isUnlimited,
          source: "override",
        };
      }
    }

    // 5. Parallelized derivation of current usage metrics
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const monthlyPeriod = {
      type: "monthly" as const,
      start: periodStart,
      end: periodEnd,
    };

    const [
      usersCount,
      workspacesCount,
      layersCount,
      datasetsCount,
      rulesCount,
      apiRequestsCount,
      spatialQueriesCount,
      exportsCount,
      importsCount,
    ] = await Promise.all([
      usageService.getCountFromSource(organizationId, USAGE_METRIC.USERS),
      usageService.getCountFromSource(organizationId, USAGE_METRIC.WORKSPACES),
      usageService.getCountFromSource(organizationId, USAGE_METRIC.LAYERS),
      usageService.getCountFromSource(organizationId, USAGE_METRIC.DATASETS),
      usageService.getCountFromSource(organizationId, USAGE_METRIC.RULES),
      usageService.getCurrentUsage(
        organizationId,
        USAGE_METRIC.API_REQUESTS,
        monthlyPeriod,
      ),
      usageService.getCurrentUsage(
        organizationId,
        USAGE_METRIC.SPATIAL_QUERIES,
        monthlyPeriod,
      ),
      usageService.getCurrentUsage(
        organizationId,
        USAGE_METRIC.EXPORTS,
        monthlyPeriod,
      ),
      usageService.getCurrentUsage(
        organizationId,
        USAGE_METRIC.IMPORTS,
        monthlyPeriod,
      ),
    ]);

    const usage: Record<string, number> = {
      [USAGE_METRIC.USERS]: usersCount,
      [USAGE_METRIC.WORKSPACES]: workspacesCount,
      [USAGE_METRIC.LAYERS]: layersCount,
      [USAGE_METRIC.DATASETS]: datasetsCount,
      [USAGE_METRIC.RULES]: rulesCount,
      [USAGE_METRIC.API_REQUESTS]: apiRequestsCount,
      [USAGE_METRIC.SPATIAL_QUERIES]: spatialQueriesCount,
      [USAGE_METRIC.EXPORTS]: exportsCount,
      [USAGE_METRIC.IMPORTS]: importsCount,
    };

    const hasActiveSubscription =
      effectiveStatus === SUBSCRIPTION_STATUS.ACTIVE ||
      effectiveStatus === SUBSCRIPTION_STATUS.TRIALING;

    return {
      organizationId,
      plan: planRow
        ? { id: planRow.id, code: planRow.code, name: planRow.name }
        : null,
      subscription: subscription
        ? {
            id: subscription.id,
            status: effectiveStatus as SubscriptionStatus,
            startsAt: subscription.startsAt,
            endsAt: subscription.endsAt ?? null,
            trialEndsAt: subscription.trialEndsAt ?? null,
          }
        : null,
      subscriptionStatus: effectiveStatus,
      features,
      limits,
      usage,
      hasActiveSubscription,
      resolvedAt: now,
    };
  }

  /**
   * Resolves the effective subscription status accounting for:
   * - Trial expiration (trialEndsAt in the past → treat as EXPIRED)
   * - Subscription expiration (endsAt in the past → treat as EXPIRED)
   *
   * The entitlement engine can determine expiration from timestamps alone,
   * without requiring a background scheduler.
   */
  private resolveSubscriptionStatus(
    subscription: {
      status: string;
      trialEndsAt: Date | null;
      endsAt: Date | null;
    },
    now: Date,
  ): SubscriptionStatus {
    const status = subscription.status as SubscriptionStatus;

    // Trial expiration check
    if (status === SUBSCRIPTION_STATUS.TRIALING) {
      if (subscription.trialEndsAt && subscription.trialEndsAt < now) {
        return SUBSCRIPTION_STATUS.EXPIRED;
      }
    }

    // General expiration check
    if (
      status === SUBSCRIPTION_STATUS.ACTIVE ||
      status === SUBSCRIPTION_STATUS.TRIALING
    ) {
      if (subscription.endsAt && subscription.endsAt < now) {
        return SUBSCRIPTION_STATUS.EXPIRED;
      }
    }

    return status;
  }

  /**
   * Check if an organization has a specific feature enabled.
   *
   * Usage: entitlementService.hasFeature(organizationId, "REALTIME")
   * Returns: true | false
   *
   * Does not expose database implementation to consumers.
   */
  async hasFeature(
    organizationId: string,
    featureCode: string,
  ): Promise<boolean> {
    const result = await this.checkFeature(organizationId, featureCode);
    return result.allowed;
  }

  /**
   * Structured feature check with detailed result.
   * Used by API middleware and frontend for meaningful error messages.
   */
  async checkFeature(
    organizationId: string,
    featureCode: string,
  ): Promise<EntitlementCheckResult> {
    const entitlements = await this.getEffectiveEntitlements(organizationId);

    const baseResult = {
      featureCode,
      organizationId,
      planCode: entitlements.plan?.code ?? null,
      subscriptionStatus: entitlements.subscriptionStatus,
    };

    // Subscription suspension takes priority
    if (entitlements.subscriptionStatus === SUBSCRIPTION_STATUS.SUSPENDED) {
      return {
        ...baseResult,
        allowed: false,
        reason: "SUBSCRIPTION_SUSPENDED",
      };
    }

    // Subscription expiration
    if (entitlements.subscriptionStatus === SUBSCRIPTION_STATUS.EXPIRED) {
      return {
        ...baseResult,
        allowed: false,
        reason: "SUBSCRIPTION_EXPIRED",
      };
    }

    // Check if feature is enabled
    const isEnabled = entitlements.features[featureCode] === true;

    if (!isEnabled) {
      // Determine specific denial reason
      const overrides = entitlements.features;
      // Feature might be disabled by override or simply not in plan
      const reason: EntitlementDenialReason = "FEATURE_NOT_IN_PLAN";
      return { ...baseResult, allowed: false, reason };
    }

    return { ...baseResult, allowed: true };
  }

  /**
   * Get the effective limit for a metric.
   * Returns { value, isUnlimited } — never exposes DB internals.
   */
  async getLimit(
    organizationId: string,
    metricCode: string,
  ): Promise<{ value: number | null; isUnlimited: boolean }> {
    const entitlements = await this.getEffectiveEntitlements(organizationId);
    const limit = entitlements.limits[metricCode];

    if (!limit) {
      // No limit configured — default to a sensible restriction
      return { value: 0, isUnlimited: false };
    }

    return { value: limit.numericValue, isUnlimited: limit.isUnlimited };
  }

  /**
   * Check if an organization can consume a given amount of a resource.
   *
   * Usage: entitlementService.checkLimit(organizationId, "MAX_LAYERS", 1)
   * Returns: LimitCheckResult with ALLOWED or DENIED + structured details
   *
   * Also validates that the subscription is in an active state.
   */
  async checkLimit(
    organizationId: string,
    metricCode: string,
    requestedAmount = 1,
  ): Promise<LimitCheckResult> {
    const entitlements = await this.getEffectiveEntitlements(organizationId);

    const baseResult = {
      metricCode,
      organizationId,
      requestedAmount,
      currentUsage:
        entitlements.usage[this.metricToUsageMetric(metricCode)] ?? 0,
    };

    // Subscription suspension blocks all operations
    if (entitlements.subscriptionStatus === SUBSCRIPTION_STATUS.SUSPENDED) {
      return {
        ...baseResult,
        allowed: false,
        limit: null,
        isUnlimited: false,
        reason: "SUBSCRIPTION_SUSPENDED",
      };
    }

    const limit = entitlements.limits[metricCode];

    // No limit configured for this metric — allow (treat as default)
    if (!limit) {
      return {
        ...baseResult,
        allowed: true,
        limit: null,
        isUnlimited: true,
      };
    }

    // isUnlimited=true → always ALLOWED (explicit unlimited representation)
    if (limit.isUnlimited) {
      return {
        ...baseResult,
        allowed: true,
        limit: null,
        isUnlimited: true,
      };
    }

    // Check numeric limit
    const ceiling = limit.numericValue ?? 0;
    const currentUsage = baseResult.currentUsage;
    const allowed = currentUsage + requestedAmount <= ceiling;

    return {
      ...baseResult,
      allowed,
      limit: ceiling,
      isUnlimited: false,
      ...(allowed
        ? {}
        : { reason: "LIMIT_EXCEEDED" as EntitlementDenialReason }),
    };
  }

  /**
   * Returns true only when the organization can consume the given amount.
   * Convenience wrapper around checkLimit().
   */
  async canConsume(
    organizationId: string,
    metricCode: string,
    amount = 1,
  ): Promise<boolean> {
    const result = await this.checkLimit(organizationId, metricCode, amount);
    return result.allowed;
  }

  /**
   * Returns current usage for a specific metric.
   * Delegates to UsageService for single source of truth.
   */
  async getUsage(organizationId: string, metricCode: string): Promise<number> {
    const usageMetric = this.metricToUsageMetric(metricCode);
    return usageService.getCountFromSource(organizationId, usageMetric);
  }

  /**
   * Maps a plan limit metric code (MAX_USERS) to the usage metric code (USERS).
   * This keeps the two code spaces separate while allowing cross-referencing.
   */
  private metricToUsageMetric(metricCode: string): string {
    const mapping: Record<string, string> = {
      MAX_USERS: USAGE_METRIC.USERS,
      MAX_WORKSPACES: USAGE_METRIC.WORKSPACES,
      MAX_LAYERS: USAGE_METRIC.LAYERS,
      MAX_SPATIAL_DATASETS: USAGE_METRIC.DATASETS,
      MAX_RULES: USAGE_METRIC.RULES,
      MAX_ALERTS: USAGE_METRIC.ALERTS,
      MAX_API_REQUESTS: USAGE_METRIC.API_REQUESTS,
      MAX_SPATIAL_QUERIES: USAGE_METRIC.SPATIAL_QUERIES,
      MAX_REALTIME_CONNECTIONS: USAGE_METRIC.REALTIME_CONNECTIONS,
      MAX_STORAGE_BYTES: USAGE_METRIC.STORAGE_BYTES,
      MAX_EXPORTS: USAGE_METRIC.EXPORTS,
      MAX_IMPORTS: USAGE_METRIC.IMPORTS,
    };
    return mapping[metricCode] ?? metricCode;
  }

  private getMemoryFallbackEntitlements(
    organizationId: string,
  ): EffectiveEntitlements {
    const features: Record<string, boolean> = {
      GIS_MAP: true,
      GIS_LAYERS: true,
      SPATIAL_QUERY: true,
      SPATIAL_ANALYTICS: true,
      REALTIME: true,
      RULE_ENGINE: true,
      WORKFLOW_ENGINE: true,
      ALERTS: true,
      DASHBOARDS: true,
      API_ACCESS: true,
      MOBILE_SDK: true,
      WEB_SDK: true,
      EXPORT: true,
      IMPORT: true,
      ADVANCED_ANALYTICS: true,
    };
    const limits: Record<string, EffectiveLimit> = {
      MAX_USERS: {
        metricCode: "MAX_USERS",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_WORKSPACES: {
        metricCode: "MAX_WORKSPACES",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_LAYERS: {
        metricCode: "MAX_LAYERS",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_SPATIAL_DATASETS: {
        metricCode: "MAX_SPATIAL_DATASETS",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_RULES: {
        metricCode: "MAX_RULES",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_ALERTS: {
        metricCode: "MAX_ALERTS",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_API_REQUESTS: {
        metricCode: "MAX_API_REQUESTS",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_SPATIAL_QUERIES: {
        metricCode: "MAX_SPATIAL_QUERIES",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_REALTIME_CONNECTIONS: {
        metricCode: "MAX_REALTIME_CONNECTIONS",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
      MAX_STORAGE_BYTES: {
        metricCode: "MAX_STORAGE_BYTES",
        numericValue: null,
        isUnlimited: true,
        source: "default",
      },
    };
    return {
      organizationId,
      plan: {
        id: "mem-plan-pro",
        code: "PRO",
        name: "Pro Plan (Test Fallback)",
      },
      subscription: {
        id: "mem-sub-1",
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startsAt: new Date(),
        endsAt: null,
        trialEndsAt: null,
      },
      subscriptionStatus: SUBSCRIPTION_STATUS.ACTIVE,
      features,
      limits,
      usage: {},
      hasActiveSubscription: true,
      resolvedAt: new Date(),
    };
  }
}

/** Singleton instance for use across all modules */
export const entitlementService = new EntitlementService();
