/**
 * Intersects Search API
 *
 * POST /api/v1/spatial/search/intersects
 * Body: { geometry: Geometry, type?: string, limit?: number, offset?: number }
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { PostGisSpatialRepository } from "@/core/gis/infrastructure/postgis-spatial.repository";
import { SpatialDataService } from "@/core/gis/services/spatial-data.service";
import { spatialFeaturesToFeatureCollection } from "@/core/gis/types/feature";

const repository = new PostGisSpatialRepository(db);
const service = new SpatialDataService(repository);

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const result = await service.searchIntersects(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    body.geometry,
    {
      type: body.type,
      limit: body.limit,
      offset: body.offset,
    },
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
