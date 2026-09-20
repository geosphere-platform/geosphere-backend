import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialAnalyticsService } from "../../../query-shared";

/**
 * GET /api/v1/spatial/analytics/geofences/[id]
 * Geofence entry/exit analytics and interval tracking.
 */
export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_EVENTS_ANALYTICS)) {
      throw new ForbiddenError(
        "Permission 'gis:events:analytics' required for geofence analytics",
      );
    }

    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const params = (context?.params as { id?: string }) ?? {};
    const geofenceId = params.id;

    if (!geofenceId) {
      throw new ValidationError("Geofence ID route parameter is required");
    }

    const url = new URL(ctx.request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (!from || !to) {
      throw new ValidationError("from and to query parameters are required");
    }

    const result = await spatialAnalyticsService.getGeofenceAnalytics(
      tenantId,
      geofenceId,
      from,
      to,
    );

    return ApiResponse.success(result, 200);
  },
);
