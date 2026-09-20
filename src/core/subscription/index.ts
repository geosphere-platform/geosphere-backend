/**
 * Phase 13 — Subscription Module Barrel Export
 *
 * Single entry point for all subscription and entitlement services.
 * Import from this file to avoid coupling to internal module structure.
 */

export { entitlementService, EntitlementService } from "./entitlement.service";
export { usageService, UsageService } from "./usage.service";
export { planService, PlanService } from "./plan.service";
export {
  subscriptionService,
  SubscriptionService,
} from "./subscription.service";
export { featureService, FeatureService } from "./feature.service";
export { overrideService, OverrideService } from "./override.service";

export * from "./types";
export * from "./errors";
