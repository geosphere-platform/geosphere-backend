import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors/errors";
import { spatialAnalyticsService } from "../../query-shared";

/**
 * GET /api/v1/spatial/analytics/events
 * Query spatial event distribution analytics.
 */
export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_EVENTS_ANALYTICS)) {
    throw new ForbiddenError(
      "Permission 'gis:events:analytics' required for event analytics",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const url = new URL(ctx.request.url);

  const eventType = url.searchParams.get("eventType") ?? undefined;
  const subjectId = url.searchParams.get("subjectId") ?? undefined;
  const geofenceId = url.searchParams.get("geofenceId") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const result = await spatialAnalyticsService.getEventAnalytics(tenantId, {
    eventType,
    subjectId,
    geofenceId,
    from,
    to,
  });

  return ApiResponse.success(result, 200);
});
