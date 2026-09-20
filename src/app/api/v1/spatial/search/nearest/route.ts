/**
 * Nearest Neighbor (KNN) Search API
 *
 * GET /api/v1/spatial/search/nearest
 * Query parameters: longitude (lng), latitude (lat), type, limit
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { PostGisSpatialRepository } from "@/core/gis/infrastructure/postgis-spatial.repository";
import { SpatialDataService } from "@/core/gis/services/spatial-data.service";
import { spatialFeaturesToFeatureCollection } from "@/core/gis/types/feature";

const repository = new PostGisSpatialRepository(db);
const service = new SpatialDataService(repository);

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const url = new URL(ctx.request.url);

  const lng = parseFloat(
    url.searchParams.get("longitude") ?? url.searchParams.get("lng") ?? "NaN",
  );
  const lat = parseFloat(
    url.searchParams.get("latitude") ?? url.searchParams.get("lat") ?? "NaN",
  );
  const type = url.searchParams.get("type") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  const result = await service.searchNearest(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    lng,
    lat,
    { type, limit },
  );

  const featureCollection = spatialFeaturesToFeatureCollection(result.items);

  return ApiResponse.success(
    {
      ...featureCollection,
      total: result.total,
      limit: result.limit,
      offset: 0,
      hasMore: false,
    },
    200,
  );
});
