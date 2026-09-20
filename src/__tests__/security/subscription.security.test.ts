/**
 * Phase 13 — Subscription Security Unit Tests
 */

import { withFeature, withLimit } from "../../core/subscription/guards";
import {
  FeatureNotAvailableError,
  EntitlementLimitExceededError,
} from "../../core/subscription/errors";

export function runSubscriptionSecurityUnitTests() {
  const err1 = new FeatureNotAvailableError("REALTIME", "org-123", "FREE");
  if (err1.statusCode !== 403)
    throw new Error("FeatureNotAvailableError must return 403 status");
  if (err1.errorCode !== "FEATURE_NOT_AVAILABLE")
    throw new Error("ErrorCode mismatch");
  if ((err1.details as any).feature !== "REALTIME")
    throw new Error("Feature detail mismatch");

  const err2 = new EntitlementLimitExceededError("MAX_LAYERS", 25, 25, 1);
  if (err2.statusCode !== 403)
    throw new Error("EntitlementLimitExceededError must return 403 status");
  if (err2.errorCode !== "ENTITLEMENT_LIMIT_EXCEEDED")
    throw new Error("ErrorCode mismatch");
  if ((err2.details as any).metric !== "MAX_LAYERS")
    throw new Error("Metric detail mismatch");

  if (typeof withFeature !== "function")
    throw new Error("withFeature guard missing");
  if (typeof withLimit !== "function")
    throw new Error("withLimit guard missing");
}
