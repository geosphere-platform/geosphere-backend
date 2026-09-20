/**
 * Spatial Feature Item API — Read, Update, Delete Endpoints
 *
 * GET    /api/v1/spatial/features/:id  -> Read Feature
 * PATCH  /api/v1/spatial/features/:id  -> Update Feature
 * DELETE /api/v1/spatial/features/:id  -> Delete Feature
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { PostGisSpatialRepository } from "@/core/gis/infrastructure/postgis-spatial.repository";
import { SpatialDataService } from "@/core/gis/services/spatial-data.service";
import { spatialFeatureToGeoJson } from "@/core/gis/types/feature";

const repository = new PostGisSpatialRepository(db);
const service = new SpatialDataService(repository);

async function extractRouteId(
  context?: Record<string, unknown>,
): Promise<string> {
  const rawParams = context?.params;
  const params =
    rawParams instanceof Promise
      ? await rawParams
      : (rawParams as { id: string } | undefined);
  return params?.id ?? "";
}

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    try {
      const tenantId = ctx.user.orgId ?? "default-tenant-0000";
      const id = await extractRouteId(context);

      const feature = await service.getFeatureById(
        {
          tenantId,
          userId: ctx.user.sub,
          role: ctx.user.role,
        },
        id,
      );

      return ApiResponse.success(spatialFeatureToGeoJson(feature), 200);
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status ?? 404;
      const code = err?.errorCode ?? err?.code ?? "SPATIAL_FEATURE_NOT_FOUND";
      return ApiResponse.error(
        err?.message || "Feature not found",
        status,
        code,
      );
    }
  },
);

export const PATCH = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    try {
      const tenantId = ctx.user.orgId ?? "default-tenant-0000";
      const id = await extractRouteId(context);
      const body = await ctx.request.json();

      const feature = await service.updateFeature(
        {
          tenantId,
          userId: ctx.user.sub,
          role: ctx.user.role,
        },
        id,
        {
          geometry: body.geometry,
          properties: body.properties,
          metadata: body.metadata,
        },
      );

      return ApiResponse.success(spatialFeatureToGeoJson(feature), 200);
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status ?? 400;
      const code = err?.errorCode ?? err?.code ?? "INVALID_SPATIAL_UPDATE";
      return ApiResponse.error(
        err?.message || "Feature update failed",
        status,
        code,
      );
    }
  },
);

export const DELETE = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    try {
      const tenantId = ctx.user.orgId ?? "default-tenant-0000";
      const id = await extractRouteId(context);

      await service.deleteFeature(
        {
          tenantId,
          userId: ctx.user.sub,
          role: ctx.user.role,
        },
        id,
      );

      return ApiResponse.success({ id, deleted: true }, 200);
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status ?? 404;
      const code = err?.errorCode ?? err?.code ?? "SPATIAL_FEATURE_NOT_FOUND";
      return ApiResponse.error(
        err?.message || "Feature deletion failed",
        status,
        code,
      );
    }
  },
);
