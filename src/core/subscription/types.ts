/**
 * Phase 13 — Subscription & Entitlement Domain Types
 *
 * Central type definitions for the entitlement engine.
 * These types are the stable contract between the entitlement layer
 * and all consumers (GIS Core, Realtime, Analytics, Rules, API, Frontend SDK).
 *
 * No module should independently calculate plan permissions.
 * All entitlement resolution flows through EntitlementService.
 */

import type {
  PlanStatus,
  SubscriptionStatus,
  FeatureCategory,
  LimitMetric,
  FeatureCode,
  UsageMetric,
  OverrideType,
  PlanRow,
  FeatureRow,
  SubscriptionRow,
  PlanFeatureRow,
  PlanLimitRow,
  OrganizationEntitlementOverrideRow,
  UsageRecordRow,
} from "../../database/schema/subscription";

// Re-export constants for consumers
export {
  PLAN_STATUS,
  SUBSCRIPTION_STATUS,
  ACTIVE_SUBSCRIPTION_STATUSES,
  FEATURE_CATEGORY,
  FEATURE_STATUS,
  FEATURE_CODE,
  LIMIT_METRIC,
  USAGE_METRIC,
  OVERRIDE_TYPE,
} from "../../database/schema/subscription";

export type {
  PlanStatus,
  SubscriptionStatus,
  FeatureCategory,
  LimitMetric,
  FeatureCode,
  UsageMetric,
  OverrideType,
  PlanRow,
  FeatureRow,
  SubscriptionRow,
  PlanFeatureRow,
  PlanLimitRow,
  OrganizationEntitlementOverrideRow,
  UsageRecordRow,
};

// ─── Effective Entitlements ───────────────────────────────────────────────────

/**
 * A resolved, structured snapshot of an organization's entitlements.
 * Produced by EntitlementService.getEffectiveEntitlements().
 *
 * Incorporates (in priority order):
 *   1. Organization overrides
 *   2. Plan features and limits
 *   3. System defaults
 */
export interface EffectiveEntitlements {
  organizationId: string;
  plan: {
    id: string;
    code: string;
    name: string;
  } | null;
  subscription: {
    id: string;
    status: SubscriptionStatus;
    startsAt: Date;
    endsAt: Date | null;
    trialEndsAt: Date | null;
  } | null;
  subscriptionStatus: SubscriptionStatus | "NO_SUBSCRIPTION";
  /**
   * Map of feature code → enabled/disabled
   * Includes both plan features and org overrides.
   */
  features: Record<string, boolean>;
  /**
   * Map of metric code → effective limit
   * isUnlimited=true means no ceiling applies.
   */
  limits: Record<string, EffectiveLimit>;
  /**
   * Current usage snapshot (derived at resolution time)
   */
  usage: Record<string, number>;
  /**
   * Whether the organization has full access
   * (subscription is ACTIVE or TRIALING and not expired)
   */
  hasActiveSubscription: boolean;
  resolvedAt: Date;
}

export interface EffectiveLimit {
  metricCode: string;
  /** Effective ceiling. Null when isUnlimited=true. */
  numericValue: number | null;
  /** When true: this metric has no ceiling — always ALLOWED */
  isUnlimited: boolean;
  /** Source of this limit: 'override' | 'plan' | 'default' */
  source: "override" | "plan" | "default";
}

// ─── Entitlement Check Result ─────────────────────────────────────────────────

/**
 * Structured result for a feature entitlement check.
 * Never return only true/false — always include context for APIs and UI.
 */
export interface EntitlementCheckResult {
  allowed: boolean;
  featureCode: string;
  organizationId: string;
  planCode: string | null;
  subscriptionStatus: SubscriptionStatus | "NO_SUBSCRIPTION";
  /**
   * Why the check failed. Only present when allowed=false.
   * Values: FEATURE_NOT_IN_PLAN | SUBSCRIPTION_SUSPENDED | SUBSCRIPTION_EXPIRED |
   *         SUBSCRIPTION_REQUIRED | TRIAL_EXPIRED | FEATURE_DISABLED_BY_OVERRIDE
   */
  reason?: EntitlementDenialReason;
}

/**
 * Structured result for a resource limit check.
 * Never return only true/false — always include context for APIs and UI.
 */
export interface LimitCheckResult {
  allowed: boolean;
  metricCode: string;
  organizationId: string;
  currentUsage: number;
  requestedAmount: number;
  /** Effective limit value. Null when isUnlimited=true. */
  limit: number | null;
  isUnlimited: boolean;
  /**
   * Why the check failed. Only present when allowed=false.
   * Values: LIMIT_EXCEEDED | SUBSCRIPTION_SUSPENDED | SUBSCRIPTION_REQUIRED
   */
  reason?: EntitlementDenialReason;
}

export type EntitlementDenialReason =
  | "FEATURE_NOT_IN_PLAN"
  | "SUBSCRIPTION_SUSPENDED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_REQUIRED"
  | "TRIAL_EXPIRED"
  | "FEATURE_DISABLED_BY_OVERRIDE"
  | "LIMIT_EXCEEDED";

// ─── Usage Period ─────────────────────────────────────────────────────────────

export type UsagePeriodType = "monthly" | "daily" | "lifetime" | "current";

export interface UsagePeriod {
  type: UsagePeriodType;
  start: Date;
  end: Date;
}

export interface UsageSummary {
  metricCode: string;
  organizationId: string;
  current: number;
  period?: UsagePeriod;
}

// ─── Plan Management ──────────────────────────────────────────────────────────

export interface CreatePlanInput {
  code: string;
  name: string;
  description?: string;
  status?: PlanStatus;
  isPublic?: boolean;
  displayOrder?: number;
  monthlyPriceCents?: number;
  yearlyPriceCents?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  status?: PlanStatus;
  isPublic?: boolean;
  displayOrder?: number;
  monthlyPriceCents?: number;
  yearlyPriceCents?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface SetPlanLimitInput {
  metricCode: string;
  numericValue?: number | null;
  isUnlimited?: boolean;
}

// ─── Feature Management ───────────────────────────────────────────────────────

export interface CreateFeatureInput {
  code: string;
  name: string;
  description?: string;
  category?: FeatureCategory;
  metadata?: Record<string, unknown>;
}

export interface UpdateFeatureInput {
  name?: string;
  description?: string;
  category?: FeatureCategory;
  metadata?: Record<string, unknown>;
}

// ─── Subscription Management ──────────────────────────────────────────────────

export interface AssignPlanInput {
  organizationId: string;
  planId: string;
  startsAt?: Date;
  endsAt?: Date;
  billingInterval?: "MONTHLY" | "YEARLY";
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface ChangePlanInput {
  organizationId: string;
  newPlanId: string;
  /** If true, allow change even when usage exceeds new plan limits */
  forceDowngrade?: boolean;
}

export interface StartTrialInput {
  organizationId: string;
  planId: string;
  trialDays: number;
}

/**
 * Result of a downgrade check before plan change.
 * Documents usage vs new limits without deleting data.
 */
export interface DowngradeCheckResult {
  safe: boolean;
  /** Metrics where current usage exceeds the new plan limit */
  violations: Array<{
    metricCode: string;
    currentUsage: number;
    newLimit: number | null;
    isUnlimited: boolean;
  }>;
}

// ─── Override Management ──────────────────────────────────────────────────────

export interface SetOverrideInput {
  organizationId: string;
  resourceCode: string;
  overrideType: OverrideType;
  numericValue?: number | null;
  isUnlimited?: boolean;
  isEnabled?: boolean;
  reason?: string;
}

// ─── API Error Shapes ─────────────────────────────────────────────────────────

/**
 * Standardized API error detail for entitlement failures.
 * Follows the existing ApiResponse error contract.
 *
 * Per spec section 97:
 * {
 *   code: "ENTITLEMENT_LIMIT_EXCEEDED",
 *   metric: "MAX_LAYERS",
 *   currentUsage: 25,
 *   limit: 25
 * }
 */
export interface EntitlementErrorDetail {
  code: string;
  metric?: string;
  feature?: string;
  currentUsage?: number;
  requestedAmount?: number;
  limit?: number | null;
  isUnlimited?: boolean;
  plan?: string | null;
  subscriptionStatus?: string;
}
