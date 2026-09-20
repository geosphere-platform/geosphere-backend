/**
 * POST /api/v1/spatial/clusters
 *
 * Spatial Point Clustering API Endpoint
 * Returns server-side spatial clusters for point datasets within a viewport extent.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { SpatialClusterService } from "@/core/gis/clustering/spatial-cluster.service";
import { BoundingBox } from "@/core/gis/bbox/bounding-box";
import { db } from "@/database";

const spatialClusterService = new SpatialClusterService(db);

export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_QUERY_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:query:read' required for spatial clustering",
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
    gridSizeDegrees?: number;
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
  const clusters = await spatialClusterService.clusterViewport(tenantId, bbox, {
    zoom: body.zoom,
    layerId: body.layerId,
    gridSizeDegrees: body.gridSizeDegrees,
    limit: body.limit,
  });

  return ApiResponse.success(
    {
      clusters,
      count: clusters.length,
      zoom: body.zoom,
      tenantId,
    },
    200,
  );
});
