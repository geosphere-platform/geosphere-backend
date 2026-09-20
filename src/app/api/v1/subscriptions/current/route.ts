/**
 * GET /api/v1/subscriptions/current
 * Returns the current active subscription for the requesting organization.
 *
 * Security: organizationId is derived from JWT (never from request body).
 * Tenant isolation: each org sees only its own subscription.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { subscriptionService } from "@/core/subscription/subscription.service";
import { planService } from "@/core/subscription/plan.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  withPermission(PERMISSIONS.SUBSCRIPTION_READ)(async (ctx: AuthContext) => {
    const organizationId = ctx.user.orgId;
    if (!organizationId) {
      return ApiResponse.error(
        "Organization context is required",
        400,
        "BAD_REQUEST",
      );
    }

    const subscription =
      await subscriptionService.getOrganizationSubscription(organizationId);

    if (!subscription) {
      return ApiResponse.success(null, 200, {
        message: "No active subscription",
      });
    }

    // Include plan details for UI rendering
    const plan = await planService.getPlan(subscription.planId);
    const features = await planService.getPlanFeatures(subscription.planId);
    const limits = await planService.getPlanLimits(subscription.planId);

    return ApiResponse.success({
      subscription,
      plan: { ...plan, features, limits },
    });
  }),
);
