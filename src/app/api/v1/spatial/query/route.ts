import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialQueryService } from "../query-shared";
import { SpatialQuery } from "@/core/gis/query/spatial-query.model";

/**
 * POST /api/v1/spatial/query
 * Generic feature query supporting combined spatial, attribute, and temporal filters.
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_QUERY_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:query:read' required for spatial query",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  let body: SpatialQuery;
  try {
    body = await ctx.request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body");
  }

  const result = await spatialQueryService.queryFeatures(tenantId, body);

  return ApiResponse.success(result.features, 200, {
    meta: result.meta,
  });
});
