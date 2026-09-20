/**
 * Phase 13 — Subscription Usage Service Unit Tests
 */

import { UsageService } from "../../core/subscription/usage.service";

export function runSubscriptionUsageUnitTests() {
  const usageService = new UsageService();

  if (!usageService) throw new Error("UsageService failed to instantiate");
  if (typeof usageService.getCountFromSource !== "function")
    throw new Error("getCountFromSource missing");
  if (typeof usageService.recordUsage !== "function")
    throw new Error("recordUsage missing");
  if (typeof usageService.getCurrentUsage !== "function")
    throw new Error("getCurrentUsage missing");
  if (typeof usageService.reconcileUsage !== "function")
    throw new Error("reconcileUsage missing");
  if (typeof usageService.recordApiRequest !== "function")
    throw new Error("recordApiRequest missing");
  if (typeof usageService.recordSpatialQuery !== "function")
    throw new Error("recordSpatialQuery missing");
}
