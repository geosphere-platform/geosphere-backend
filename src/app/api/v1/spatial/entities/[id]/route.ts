import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, NotFoundError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleSpatialEntityRepository } from "@/core/gis/infrastructure/drizzle-spatial-entity.repository";

export const GET = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_READ)) {
      throw new ForbiddenError(
        "Insufficient permissions to view spatial entity",
      );
    }

    const params = await (routeCtx?.params as
      Promise<{ id: string }> | { id: string });
    const id = params?.id;
    if (!id) throw new NotFoundError("Spatial entity ID required");

    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const repo = new DrizzleSpatialEntityRepository(db);

    const entity = await repo.findById(id, tenantId);
    if (!entity) {
      throw new NotFoundError("Spatial entity not found or access denied");
    }

    return ApiResponse.success(entity, 200);
  },
);

export const DELETE = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_FEATURE_DELETE)) {
      throw new ForbiddenError(
        "Insufficient permissions to delete spatial entity",
      );
    }

    const params = await (routeCtx?.params as
      Promise<{ id: string }> | { id: string });
    const id = params?.id;
    if (!id) throw new NotFoundError("Spatial entity ID required");

    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const repo = new DrizzleSpatialEntityRepository(db);

    const deleted = await repo.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError("Spatial entity not found or access denied");
    }

    return ApiResponse.success(
      { message: "Spatial entity deleted successfully" },
      200,
    );
  },
);
