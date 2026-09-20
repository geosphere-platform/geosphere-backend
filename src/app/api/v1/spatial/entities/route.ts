import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleSpatialEntityRepository } from "@/core/gis/infrastructure/drizzle-spatial-entity.repository";
import { isValidPointGeometry } from "@/core/gis/types/geometry";

export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_READ)) {
    throw new ForbiddenError(
      "Insufficient permissions to view spatial entities",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const repo = new DrizzleSpatialEntityRepository(db);

  const url = new URL(ctx.request.url);
  const entityType = url.searchParams.get("type");
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  const entities = entityType
    ? await repo.findByType(tenantId, entityType, limit, offset)
    : await repo.findByTenant(tenantId, limit, offset);

  return ApiResponse.success(entities, 200);
});

export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_CREATE)) {
    throw new ForbiddenError(
      "Insufficient permissions to create spatial entity",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  if (!body.entityType || typeof body.entityType !== "string") {
    throw new ValidationError("entityType string is required");
  }

  if (!body.geometry || !isValidPointGeometry(body.geometry)) {
    throw new ValidationError("Valid point geometry [lng, lat] is required");
  }

  const repo = new DrizzleSpatialEntityRepository(db);

  const entity = await repo.create({
    id: crypto.randomUUID(),
    tenantId,
    entityType: body.entityType,
    geometry: body.geometry,
    srid: body.srid ?? "EPSG:4326",
    properties: body.properties ?? {},
  });

  return ApiResponse.success(entity, 201);
});
