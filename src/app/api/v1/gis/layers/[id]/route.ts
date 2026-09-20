/**
 * GIS Layer Management API — Single Resource Endpoints
 *
 * GET    /api/v1/gis/layers/:id -> Fetch single layer configuration
 * PATCH  /api/v1/gis/layers/:id -> Update layer configuration
 * DELETE /api/v1/gis/layers/:id -> Delete layer configuration
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { gisVisualizationConfigsTable } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/core/auth/permissions";
import { PERMISSIONS } from "@/core/constants";

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
    if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_READ)) {
      return ApiResponse.error(
        "Insufficient permission to read GIS layer configuration",
        403,
        "FORBIDDEN",
      );
    }

    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const layerId = await extractRouteId(context);

    const [row] = await db
      .select()
      .from(gisVisualizationConfigsTable)
      .where(
        and(
          eq(gisVisualizationConfigsTable.tenantId, tenantId),
          eq(gisVisualizationConfigsTable.layerId, layerId),
        ),
      )
      .limit(1);

    if (!row) {
      return ApiResponse.error(
        `GIS Layer configuration '${layerId}' not found`,
        404,
        "NOT_FOUND",
      );
    }

    return ApiResponse.success(row, 200);
  },
);

export const PATCH = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_UPDATE)) {
      return ApiResponse.error(
        "Insufficient permission to update GIS layer configuration",
        403,
        "FORBIDDEN",
      );
    }

    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const layerId = await extractRouteId(context);
    const body = await ctx.request.json();

    const [updated] = await db
      .update(gisVisualizationConfigsTable)
      .set({
        name: body.name,
        layerDefinition: body.layerDefinition,
        visualizationConfig: body.visualizationConfig,
        updatedBy: ctx.user.sub,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(gisVisualizationConfigsTable.tenantId, tenantId),
          eq(gisVisualizationConfigsTable.layerId, layerId),
        ),
      )
      .returning();

    if (!updated) {
      return ApiResponse.error(
        `GIS Layer configuration '${layerId}' not found for update`,
        404,
        "NOT_FOUND",
      );
    }

    return ApiResponse.success(updated, 200);
  },
);

export const DELETE = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_DELETE)) {
      return ApiResponse.error(
        "Insufficient permission to delete GIS layer configuration",
        403,
        "FORBIDDEN",
      );
    }

    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const layerId = await extractRouteId(context);

    const [deleted] = await db
      .delete(gisVisualizationConfigsTable)
      .where(
        and(
          eq(gisVisualizationConfigsTable.tenantId, tenantId),
          eq(gisVisualizationConfigsTable.layerId, layerId),
        ),
      )
      .returning();

    if (!deleted) {
      return ApiResponse.error(
        `GIS Layer configuration '${layerId}' not found for deletion`,
        404,
        "NOT_FOUND",
      );
    }

    return ApiResponse.success({ id: layerId, deleted: true }, 200);
  },
);
