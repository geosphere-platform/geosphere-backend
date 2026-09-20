/**
 * GIS Layer Management API — Collection Endpoints
 *
 * GET  /api/v1/gis/layers -> List tenant-scoped layer & visualization configs
 * POST /api/v1/gis/layers -> Register/create new layer definition & visualization config
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { gisVisualizationConfigsTable } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { GISLayerDefinitionSchema, VisualizationConfigSchema } from "@gis/map";
import { hasPermission } from "@/core/auth/permissions";
import { PERMISSIONS } from "@/core/constants";

export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_READ)) {
    return ApiResponse.error(
      "Insufficient permission to read GIS layer configurations",
      403,
      "FORBIDDEN",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const url = new URL(ctx.request.url);
  const mapId = url.searchParams.get("mapId") || undefined;

  const conditions = [eq(gisVisualizationConfigsTable.tenantId, tenantId)];
  if (mapId) {
    conditions.push(eq(gisVisualizationConfigsTable.mapId, mapId));
  }

  const rows = await db
    .select()
    .from(gisVisualizationConfigsTable)
    .where(and(...conditions));

  return ApiResponse.success(
    {
      layers: rows.map((r) => r.layerDefinition),
      configs: rows.map((r) => r.visualizationConfig),
      total: rows.length,
    },
    200,
  );
});

export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_CREATE)) {
    return ApiResponse.error(
      "Insufficient permission to create GIS layer configurations",
      403,
      "FORBIDDEN",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const layerDef = GISLayerDefinitionSchema.parse(
    body.layerDefinition || body.layer,
  );
  const vizConfig = VisualizationConfigSchema.parse(
    body.visualizationConfig || body.config,
  );

  const [inserted] = await db
    .insert(gisVisualizationConfigsTable)
    .values({
      tenantId,
      mapId: body.mapId || "default_map",
      layerId: layerDef.id,
      name: layerDef.name,
      scope: vizConfig.scope || "tenant",
      version: vizConfig.version || 1,
      layerDefinition: layerDef,
      visualizationConfig: vizConfig,
      createdBy: ctx.user.sub,
    })
    .returning();

  return ApiResponse.success(inserted, 201);
});
