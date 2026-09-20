import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialAggregationService } from "../../query-shared";
import { AggregationMetric } from "@/core/gis/query/spatial-query.model";

/**
 * POST /api/v1/spatial/analytics/aggregate
 * Spatial metric aggregation (sum, avg, count, countByPolygon, etc.).
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_ANALYTICS_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:analytics:read' required for spatial aggregation",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  let body: {
    metric: AggregationMetric | "countByPolygon";
    field?: string;
    from?: string;
    to?: string;
    subjectId?: string;
    zones?: Array<{ id: string; name?: string; geometry: any }>;
    target?: "features" | "positions";
  };

  try {
    body = await ctx.request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body");
  }

  if (body.metric === "countByPolygon") {
    if (!body.zones || !Array.isArray(body.zones)) {
      throw new ValidationError(
        "zones array is required for countByPolygon metric",
      );
    }
    const zoneCounts = await spatialAggregationService.countByPolygon(
      tenantId,
      body.zones,
      {
        target: body.target,
      },
    );
    return ApiResponse.success(zoneCounts, 200);
  }

  const result = await spatialAggregationService.aggregateMetric(
    tenantId,
    body.metric,
    {
      field: body.field,
      from: body.from,
      to: body.to,
      subjectId: body.subjectId,
    },
  );

  return ApiResponse.success(result, 200);
});
