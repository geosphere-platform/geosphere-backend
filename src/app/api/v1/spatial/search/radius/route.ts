/**
 * Radius Search API
 *
 * GET /api/v1/spatial/search/radius
 * Query parameters: longitude (lng), latitude (lat), radius, unit (meters|kilometers)
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
  const radius = parseFloat(url.searchParams.get("radius") ?? "NaN");
  const unit = url.searchParams.get("unit") ?? "meters";
  const type = url.searchParams.get("type") ?? undefined;

  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  const result = await service.searchByRadius(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    lng,
    lat,
    radius,
    unit,
    { type, limit, offset },
  );

  const featureCollection = spatialFeaturesToFeatureCollection(result.items);

  return ApiResponse.success(
    {
      ...featureCollection,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    },
    200,
  );
});
