/**
 * GET /api/v1/entitlements
 * Returns effective entitlements snapshot for the current organization.
 * Used by frontend useEntitlements() context.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { entitlementService } from "@/core/subscription/entitlement.service";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(
  withPermission(PERMISSIONS.ENTITLEMENT_READ)(async (ctx: AuthContext) => {
    const organizationId =
      ctx.user.orgId || "00000000-0000-0000-0000-000000000001";

    const entitlements =
      await entitlementService.getEffectiveEntitlements(organizationId);

    return ApiResponse.success(entitlements);
  }),
);
