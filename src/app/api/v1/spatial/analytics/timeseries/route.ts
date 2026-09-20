import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialAnalyticsService } from "../../query-shared";
import { TimeBucket } from "@/core/gis/query/spatial-query.model";

/**
 * POST /api/v1/spatial/analytics/timeseries
 * Time-series metric aggregation.
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_ANALYTICS_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:analytics:read' required for time-series analytics",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  let body: {
    metric: "event_count" | "location_count";
    from: string;
    to: string;
    bucket: TimeBucket;
    eventType?: string;
    subjectId?: string;
  };

  try {
    body = await ctx.request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body");
  }

  if (!body.metric || !body.from || !body.to || !body.bucket) {
    throw new ValidationError(
      "metric, from, to, and bucket parameters are required",
    );
  }

  const result = await spatialAnalyticsService.getTimeSeries(
    tenantId,
    body.metric,
    body.from,
    body.to,
    body.bucket,
    {
      eventType: body.eventType,
      subjectId: body.subjectId,
    },
  );

  return ApiResponse.success(result, 200);
});
