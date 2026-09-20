import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialQueryService } from "../../query-shared";

/**
 * POST /api/v1/spatial/query/radius
 * Query features within a specified radius (in meters) of a point.
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_QUERY_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:query:read' required for radius query",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  let body: {
    center: [number, number];
    radiusMeters: number;
    layerId?: string;
    limit?: number;
  };

  try {
    body = await ctx.request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body");
  }

  if (!body.center || !Array.isArray(body.center) || body.center.length < 2) {
    throw new ValidationError("center coordinate [lng, lat] is required");
  }

  if (typeof body.radiusMeters !== "number" || body.radiusMeters <= 0) {
    throw new ValidationError("radiusMeters must be a positive number");
  }

  const featureCollection = await spatialQueryService.queryRadius(
    tenantId,
    body.center,
    body.radiusMeters,
    {
      layerId: body.layerId,
      limit: body.limit,
    },
  );

  return ApiResponse.success(featureCollection, 200);
});
