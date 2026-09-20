/**
 * POST /api/v1/entitlements/check
 * Endpoint for checking feature or limit availability (consumed by SDK/Mobile or micro-features).
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { entitlementService } from "@/core/subscription/entitlement.service";
import { PERMISSIONS } from "@/core/constants";

export const POST = withAuth(
  withPermission(PERMISSIONS.ENTITLEMENT_READ)(async (ctx: AuthContext) => {
    const organizationId = ctx.user.orgId;
    if (!organizationId) {
      return ApiResponse.error(
        "Organization context required",
        400,
        "BAD_REQUEST",
      );
    }

    const { featureCode, metricCode, requestedAmount } =
      await ctx.request.json();

    if (featureCode) {
      const result = await entitlementService.checkFeature(
        organizationId,
        featureCode,
      );
      return ApiResponse.success(result);
    }

    if (metricCode) {
      const result = await entitlementService.checkLimit(
        organizationId,
        metricCode,
        requestedAmount ?? 1,
      );
      return ApiResponse.success(result);
    }

    return ApiResponse.error(
      "Either featureCode or metricCode must be provided",
      400,
      "BAD_REQUEST",
    );
  }),
);
