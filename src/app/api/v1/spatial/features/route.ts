/**
 * Spatial Features API — Collection Endpoints
 *
 * POST /api/v1/spatial/features  -> Create Feature
 * GET  /api/v1/spatial/features  -> List Features
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { PostGisSpatialRepository } from "@/core/gis/infrastructure/postgis-spatial.repository";
import { SpatialDataService } from "@/core/gis/services/spatial-data.service";
import {
  spatialFeatureToGeoJson,
  spatialFeaturesToFeatureCollection,
} from "@/core/gis/types/feature";

const repository = new PostGisSpatialRepository(db);
const service = new SpatialDataService(repository);

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  if (
    !body.geometry ||
    !body.geometry.type ||
    !Array.isArray(body.geometry.coordinates)
  ) {
    return ApiResponse.error(
      "Invalid GeoJSON geometry payload",
      400,
      "BAD_REQUEST",
    );
  }

  // Count total coordinates/vertices
  const countVertices = (coords: any): number => {
    if (typeof coords[0] === "number") return 1;
    return coords.reduce((acc: number, c: any) => acc + countVertices(c), 0);
  };

  const vertexCount = countVertices(body.geometry.coordinates);
  const maxVertices = Number(process.env.MAX_GEOJSON_VERTICES) || 50000;
  if (vertexCount > maxVertices) {
    return ApiResponse.error(
      `Geometry exceeds maximum allowed vertex limit (${vertexCount} > ${maxVertices})`,
      400,
      "BAD_REQUEST",
    );
  }

  const feature = await service.createFeature(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    {
      id: body.id,
      type: body.type,
      geometry: body.geometry,
      srid: typeof body.srid === "number" ? body.srid : 4326,
      properties: body.properties,
      metadata: body.metadata,
    },
  );

  return ApiResponse.success(spatialFeatureToGeoJson(feature), 201);
});

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const url = new URL(ctx.request.url);

  const type = url.searchParams.get("type") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  const result = await service.listFeatures(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    type,
    limit,
    offset,
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
