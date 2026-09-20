import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialQueryService } from "../../query-shared";

/**
 * POST /api/v1/spatial/query/nearest
 * Query nearest N features to a coordinate.
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_QUERY_ADVANCED)) {
    throw new ForbiddenError(
      "Permission 'gis:query:advanced' required for nearest neighbor query",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  let body: {
    point: [number, number];
    n?: number;
    layerId?: string;
    maxDistanceMeters?: number;
  };

  try {
    body = await ctx.request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body");
  }

  if (!body.point || !Array.isArray(body.point) || body.point.length < 2) {
    throw new ValidationError("point array [lng, lat] is required");
  }

  const n = body.n ?? 10;
  const result = await spatialQueryService.queryNearest(
    tenantId,
    body.point,
    n,
    {
      layerId: body.layerId,
      maxDistanceMeters: body.maxDistanceMeters,
    },
  );

  return ApiResponse.success(result.items, 200, {
    meta: result.meta,
  });
});
