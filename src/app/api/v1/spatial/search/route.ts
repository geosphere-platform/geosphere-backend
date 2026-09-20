import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleSpatialEntityRepository } from "@/core/gis/infrastructure/drizzle-spatial-entity.repository";
import { BoundingBox } from "@/core/gis/bbox/bounding-box";

export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_READ)) {
    throw new ForbiddenError("Insufficient permissions for spatial search");
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const url = new URL(ctx.request.url);

  const entityType = url.searchParams.get("type") ?? undefined;
  const bboxParam = url.searchParams.get("bbox"); // "minLng,minLat,maxLng,maxLat"
  const latParam = url.searchParams.get("lat");
  const lngParam = url.searchParams.get("lng");
  const radiusParam = url.searchParams.get("radius"); // meters
  const limitParam = parseInt(url.searchParams.get("limit") || "50", 10);
  const offsetParam = parseInt(url.searchParams.get("offset") || "0", 10);

  let bbox: BoundingBox | undefined;
  if (bboxParam) {
    const parts = bboxParam.split(",").map((p) => parseFloat(p.trim()));
    if (parts.length !== 4 || parts.some((p) => isNaN(p))) {
      throw new ValidationError(
        "bbox parameter must be 'minLng,minLat,maxLng,maxLat'",
      );
    }
    bbox = new BoundingBox(parts[0], parts[1], parts[2], parts[3]);
  }

  let center: [number, number] | undefined;
  if (latParam && lngParam) {
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new ValidationError(
        "Invalid lat/lng coordinates for spatial search",
      );
    }
    center = [lng, lat];
  }

  const radiusMeters = radiusParam ? parseFloat(radiusParam) : undefined;
  if (
    radiusMeters !== undefined &&
    (isNaN(radiusMeters) || radiusMeters <= 0)
  ) {
    throw new ValidationError(
      "radius parameter must be a positive number in meters",
    );
  }

  const repo = new DrizzleSpatialEntityRepository(db);

  const result = await repo.search(tenantId, {
    entityType,
    bbox,
    center,
    radiusMeters,
    limit: limitParam,
    offset: offsetParam,
  });

  return ApiResponse.success(
    {
      items: result.items,
      total: result.total,
      limit: Math.min(limitParam, 500),
      offset: offsetParam,
      hasMore: offsetParam + result.items.length < result.total,
    },
    200,
  );
});
