/**
 * Phase 13 — Subscription Entitlement Engine Unit Tests
 */

import { EntitlementService } from "../../core/subscription/entitlement.service";
import { SUBSCRIPTION_STATUS } from "../../core/subscription/types";

export function runSubscriptionEntitlementUnitTests() {
  const entitlementService = new EntitlementService();

  // 1. Platform Admin Bypass
  if (!entitlementService.isPlatformAdmin("PLATFORM_ADMIN")) {
    throw new Error("PLATFORM_ADMIN role must bypass entitlement checks");
  }
  if (!entitlementService.isPlatformAdmin("SUPER_ADMIN")) {
    throw new Error("SUPER_ADMIN role must bypass entitlement checks");
  }
  if (entitlementService.isPlatformAdmin("TENANT_OWNER")) {
    throw new Error("TENANT_OWNER role must not bypass entitlement checks");
  }
  if (entitlementService.isPlatformAdmin("VIEWER")) {
    throw new Error("VIEWER role must not bypass entitlement checks");
  }

  // 2. Trial Expiration Logic
  const pastDate = new Date(Date.now() - 10000);
  const futureDate = new Date(Date.now() + 86400000);

  const subTrialExpired = {
    status: SUBSCRIPTION_STATUS.TRIALING,
    trialEndsAt: pastDate,
    endsAt: null,
  };
  const status1 = (entitlementService as any).resolveSubscriptionStatus(
    subTrialExpired,
    new Date(),
  );
  if (status1 !== SUBSCRIPTION_STATUS.EXPIRED) {
    throw new Error("Past trialEndsAt must resolve status to EXPIRED");
  }

  const subTrialActive = {
    status: SUBSCRIPTION_STATUS.TRIALING,
    trialEndsAt: futureDate,
    endsAt: null,
  };
  const status2 = (entitlementService as any).resolveSubscriptionStatus(
    subTrialActive,
    new Date(),
  );
  if (status2 !== SUBSCRIPTION_STATUS.TRIALING) {
    throw new Error("Future trialEndsAt must retain TRIALING status");
  }

  const subActiveExpired = {
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndsAt: null,
    endsAt: pastDate,
  };
  const status3 = (entitlementService as any).resolveSubscriptionStatus(
    subActiveExpired,
    new Date(),
  );
  if (status3 !== SUBSCRIPTION_STATUS.EXPIRED) {
    throw new Error("Past endsAt must resolve status to EXPIRED");
  }

  // 3. Metric Mapper
  const mapper = (entitlementService as any).metricToUsageMetric.bind(
    entitlementService,
  );
  if (mapper("MAX_USERS") !== "USERS")
    throw new Error("MAX_USERS must map to USERS");
  if (mapper("MAX_WORKSPACES") !== "WORKSPACES")
    throw new Error("MAX_WORKSPACES must map to WORKSPACES");
  if (mapper("MAX_LAYERS") !== "LAYERS")
    throw new Error("MAX_LAYERS must map to LAYERS");
  if (mapper("MAX_RULES") !== "RULES")
    throw new Error("MAX_RULES must map to RULES");
}
