/**
 * Bounding Box Search API
 *
 * GET /api/v1/spatial/search/bbox
 * Query parameters: minLongitude, minLatitude, maxLongitude, maxLatitude (or bbox=minLng,minLat,maxLng,maxLat)
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { PostGisSpatialRepository } from "@/core/gis/infrastructure/postgis-spatial.repository";
import { SpatialDataService } from "@/core/gis/services/spatial-data.service";
import { spatialFeaturesToFeatureCollection } from "@/core/gis/types/feature";
import { InvalidBBoxError } from "@/core/errors/spatial-errors";

const repository = new PostGisSpatialRepository(db);
const service = new SpatialDataService(repository);

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const url = new URL(ctx.request.url);

  let minLng: number;
  let minLat: number;
  let maxLng: number;
  let maxLat: number;

  const bboxParam = url.searchParams.get("bbox");
  if (bboxParam) {
    const parts = bboxParam.split(",").map((p) => parseFloat(p.trim()));
    if (parts.length !== 4 || parts.some((p) => isNaN(p))) {
      throw new InvalidBBoxError(
        "bbox parameter must be 'minLng,minLat,maxLng,maxLat'",
      );
    }
    [minLng, minLat, maxLng, maxLat] = parts;
  } else {
    minLng = parseFloat(
      url.searchParams.get("minLongitude") ??
        url.searchParams.get("minLng") ??
        "NaN",
    );
    minLat = parseFloat(
      url.searchParams.get("minLatitude") ??
        url.searchParams.get("minLat") ??
        "NaN",
    );
    maxLng = parseFloat(
      url.searchParams.get("maxLongitude") ??
        url.searchParams.get("maxLng") ??
        "NaN",
    );
    maxLat = parseFloat(
      url.searchParams.get("maxLatitude") ??
        url.searchParams.get("maxLat") ??
        "NaN",
    );
  }

  const type = url.searchParams.get("type") ?? undefined;
  const simplifyTolerance = url.searchParams.get("simplifyTolerance")
    ? parseFloat(url.searchParams.get("simplifyTolerance")!)
    : undefined;

  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  const result = await service.searchByBoundingBox(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    minLng,
    minLat,
    maxLng,
    maxLat,
    { type, simplifyTolerance, limit, offset },
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
