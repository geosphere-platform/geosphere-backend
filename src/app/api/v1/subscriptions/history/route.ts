/**
 * GET /api/v1/subscriptions/history
 * Returns the full subscription history for the requesting organization.
 * Includes CANCELLED, EXPIRED, and historical records for audit trail.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { subscriptionService } from "@/core/subscription/subscription.service";
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

    const history =
      await subscriptionService.getSubscriptionHistory(organizationId);
    return ApiResponse.success(history, 200, { total: history.length });
  }),
);
