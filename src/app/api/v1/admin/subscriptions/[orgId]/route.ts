/**
 * GET /api/v1/admin/subscriptions/[orgId]
 * Platform admin: Inspect an organization's subscription, effective entitlements, and overrides.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { subscriptionService } from "@/core/subscription/subscription.service";
import { entitlementService } from "@/core/subscription/entitlement.service";
import { overrideService } from "@/core/subscription/override.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  withPermission(PERMISSIONS.SUBSCRIPTION_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const orgId = (context?.params as Record<string, string>)?.orgId;

      const subscription =
        await subscriptionService.getOrganizationSubscription(orgId);
      const history = await subscriptionService.getSubscriptionHistory(orgId);
      const entitlements =
        await entitlementService.getEffectiveEntitlements(orgId);
      const overrides = await overrideService.getOrganizationOverrides(orgId);

      return ApiResponse.success({
        organizationId: orgId,
        activeSubscription: subscription,
        history,
        entitlements,
        overrides,
      });
    },
  ),
);
