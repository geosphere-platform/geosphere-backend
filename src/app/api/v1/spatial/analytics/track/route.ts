import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialAnalyticsService } from "../../query-shared";

/**
 * POST /api/v1/spatial/analytics/track
 * Movement & track statistics analytics.
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_ANALYTICS_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:analytics:read' required for movement analytics",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  let body: {
    subjectId: string;
    from: string;
    to: string;
  };

  try {
    body = await ctx.request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body");
  }

  if (!body.subjectId || !body.from || !body.to) {
    throw new ValidationError(
      "subjectId, from, and to parameters are required",
    );
  }

  const result = await spatialAnalyticsService.getMovementStatistics(
    tenantId,
    body.subjectId,
    body.from,
    body.to,
  );

  return ApiResponse.success(result, 200);
});
