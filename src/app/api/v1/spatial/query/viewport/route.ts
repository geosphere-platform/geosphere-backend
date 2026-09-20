import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialQueryService } from "../../query-shared";
import { BoundingBox } from "@/core/gis/bbox/bounding-box";

/**
 * POST /api/v1/spatial/query/viewport
 * Zoom-aware viewport query returning simplified or detailed features depending on zoom level.
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_QUERY_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:query:read' required for viewport query",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  let body: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    zoom: number;
    layerId?: string;
    limit?: number;
  };

  try {
    body = await ctx.request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body");
  }

  if (
    typeof body.minLng !== "number" ||
    typeof body.minLat !== "number" ||
    typeof body.maxLng !== "number" ||
    typeof body.maxLat !== "number"
  ) {
    throw new ValidationError(
      "minLng, minLat, maxLng, maxLat numeric parameters required",
    );
  }

  if (typeof body.zoom !== "number") {
    throw new ValidationError("zoom level numeric parameter required");
  }

  const bbox = new BoundingBox(
    body.minLng,
    body.minLat,
    body.maxLng,
    body.maxLat,
  );
  const result = await spatialQueryService.queryViewport(
    tenantId,
    bbox,
    body.zoom,
    {
      layerId: body.layerId,
      limit: body.limit,
    },
  );

  return ApiResponse.success(result, 200);
});
