/**
 * GET /api/v1/admin/subscriptions
 * Platform admin: List all subscriptions across all organizations.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { subscriptionService } from "@/core/subscription/subscription.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  withPermission(PERMISSIONS.SUBSCRIPTION_MANAGE)(async (ctx: AuthContext) => {
    const subscriptions = await subscriptionService.getAllSubscriptions();
    return ApiResponse.success(subscriptions);
  }),
);
