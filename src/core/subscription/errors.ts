/**
 * Phase 13 — Entitlement Domain Errors
 *
 * Standardized error classes for subscription and entitlement failures.
 * Extends the existing AppError hierarchy from core/errors/errors.ts.
 *
 * These errors produce structured API responses following the existing
 * ApiResponse error contract and spec section 97.
 *
 * Security: These errors NEVER expose internal plan configuration or
 * database implementation details to API consumers.
 */

import { AppError } from "../errors/errors";
import type { EntitlementErrorDetail } from "./types";

/**
 * Thrown when an organization's subscription does not include a required feature.
 *
 * API response:
 * {
 *   code: "FEATURE_NOT_AVAILABLE",
 *   message: "...",
 *   details: { feature, plan, subscriptionStatus }
 * }
 */
export class FeatureNotAvailableError extends AppError {
  constructor(
    featureCode: string,
    organizationId: string,
    planCode: string | null,
    reason = "Feature not available on current subscription plan",
  ) {
    const details: EntitlementErrorDetail = {
      code: "FEATURE_NOT_AVAILABLE",
      feature: featureCode,
      plan: planCode,
    };
    super(reason, 403, "FEATURE_NOT_AVAILABLE", details);
    this.name = "FeatureNotAvailableError";
  }
}

/**
 * Thrown when a resource limit is exceeded.
 *
 * API response:
 * {
 *   code: "ENTITLEMENT_LIMIT_EXCEEDED",
 *   metric: "MAX_LAYERS",
 *   currentUsage: 25,
 *   limit: 25
 * }
 */
export class EntitlementLimitExceededError extends AppError {
  constructor(
    metricCode: string,
    currentUsage: number,
    limit: number | null,
    requestedAmount = 1,
  ) {
    const details: EntitlementErrorDetail = {
      code: "ENTITLEMENT_LIMIT_EXCEEDED",
      metric: metricCode,
      currentUsage,
      requestedAmount,
      limit,
    };
    super(
      `Resource limit exceeded for metric '${metricCode}': current=${currentUsage}, limit=${limit}, requested=${requestedAmount}`,
      403,
      "ENTITLEMENT_LIMIT_EXCEEDED",
      details,
    );
    this.name = "EntitlementLimitExceededError";
  }
}

/**
 * Thrown when an organization has no active subscription.
 */
export class SubscriptionRequiredError extends AppError {
  constructor(organizationId: string) {
    const details: EntitlementErrorDetail = {
      code: "SUBSCRIPTION_REQUIRED",
    };
    super(
      "An active subscription is required for this operation",
      403,
      "SUBSCRIPTION_REQUIRED",
      details,
    );
    this.name = "SubscriptionRequiredError";
  }
}

/**
 * Thrown when an organization's subscription is SUSPENDED.
 * Platform-level block — normal entitlement checks fail.
 */
export class SubscriptionSuspendedError extends AppError {
  constructor() {
    const details: EntitlementErrorDetail = {
      code: "SUBSCRIPTION_SUSPENDED",
      subscriptionStatus: "SUSPENDED",
    };
    super(
      "Subscription is currently suspended. Please contact support.",
      403,
      "SUBSCRIPTION_SUSPENDED",
      details,
    );
    this.name = "SubscriptionSuspendedError";
  }
}

/**
 * Thrown when an organization's subscription or trial has expired.
 */
export class SubscriptionExpiredError extends AppError {
  constructor() {
    const details: EntitlementErrorDetail = {
      code: "SUBSCRIPTION_EXPIRED",
      subscriptionStatus: "EXPIRED",
    };
    super(
      "Subscription has expired. Please renew or upgrade your plan.",
      403,
      "SUBSCRIPTION_EXPIRED",
      details,
    );
    this.name = "SubscriptionExpiredError";
  }
}

/**
 * Thrown when attempting to archive a plan that is still referenced by subscriptions.
 */
export class PlanInUseError extends AppError {
  constructor(planId: string) {
    super(
      `Plan '${planId}' cannot be deleted because it is referenced by active or historical subscriptions`,
      409,
      "PLAN_IN_USE",
    );
    this.name = "PlanInUseError";
  }
}

/**
 * Thrown when attempting to create a second active/trialing subscription for an org.
 */
export class ActiveSubscriptionExistsError extends AppError {
  constructor(organizationId: string) {
    super(
      `Organization '${organizationId}' already has an active or trialing subscription`,
      409,
      "ACTIVE_SUBSCRIPTION_EXISTS",
    );
    this.name = "ActiveSubscriptionExistsError";
  }
}
