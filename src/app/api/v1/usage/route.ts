/**
 * GET /api/v1/usage
 * Returns complete current usage summary for all metrics for requesting organization.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { usageService } from "@/core/subscription/usage.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  withPermission(PERMISSIONS.USAGE_READ)(async (ctx: AuthContext) => {
    const organizationId = ctx.user.orgId;
    if (!organizationId) {
      return ApiResponse.error(
        "Organization context required",
        400,
        "BAD_REQUEST",
      );
    }

    const summary = await usageService.getUsageSummary(organizationId);
    return ApiResponse.success(summary);
  }),
);
