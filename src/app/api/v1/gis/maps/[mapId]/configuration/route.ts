/**
 * GIS Map Configuration API — Complete Map Rendering Preset
 *
 * GET /api/v1/gis/maps/:mapId/configuration
 * Returns complete map configuration (layers, groups, styles, labels, filters, legends)
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { gisVisualizationConfigsTable } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/core/auth/permissions";
import { PERMISSIONS } from "@/core/constants";
import { MapConfiguration } from "@gis/map";

async function extractRouteMapId(
  context?: Record<string, unknown>,
): Promise<string> {
  const rawParams = context?.params;
  const params =
    rawParams instanceof Promise
      ? await rawParams
      : (rawParams as { mapId: string } | undefined);
  return params?.mapId ?? "default_map";
}

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_READ)) {
      return ApiResponse.error(
        "Insufficient permission to read map configuration",
        403,
        "FORBIDDEN",
      );
    }

    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const mapId = await extractRouteMapId(context);

    const rows = await db
      .select()
      .from(gisVisualizationConfigsTable)
      .where(
        and(
          eq(gisVisualizationConfigsTable.tenantId, tenantId),
          eq(gisVisualizationConfigsTable.mapId, mapId),
        ),
      );

    const layers = rows.map((r) => r.layerDefinition as any);
    const vizConfigsMap: Record<string, any> = {};
    rows.forEach((r) => {
      vizConfigsMap[r.layerId] = r.visualizationConfig;
    });

    const mapConfig: MapConfiguration = {
      id: mapId,
      name:
        mapId === "default_map" ? "Default GIS Map" : `Map Preset (${mapId})`,
      center: [73.8567, 18.5204],
      zoom: 12,
      baseMap: "osm",
      layers,
      layerGroups: [],
      visualizationConfigs: vizConfigsMap,
    };

    return ApiResponse.success(mapConfig, 200);
  },
);
