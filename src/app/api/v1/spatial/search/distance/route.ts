/**
 * Distance Query & Spatial Sorting API
 *
 * GET /api/v1/spatial/search/distance
 * Query parameters: longitude (lng), latitude (lat), type, order (asc|desc), limit, offset
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { PostGisSpatialRepository } from "@/core/gis/infrastructure/postgis-spatial.repository";
import { SpatialDataService } from "@/core/gis/services/spatial-data.service";
import { spatialFeatureToGeoJson } from "@/core/gis/types/feature";

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
  const order =
    (url.searchParams.get("order") ?? "asc").toLowerCase() === "desc"
      ? "desc"
      : "asc";

  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  const result = await service.searchByDistance(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    lng,
    lat,
    { type, order, limit, offset },
  );

  const items = result.items.map((item) => ({
    feature: spatialFeatureToGeoJson(item.feature),
    distanceMeters: item.distanceMeters,
  }));

  return ApiResponse.success(
    {
      items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    },
    200,
  );
});
