import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialHistoryService } from "../query-shared";

/**
 * GET /api/v1/spatial/history
 * Query cursor-paginated location history for a subject.
 */
export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_HISTORY_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:history:read' required for history query",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const url = new URL(ctx.request.url);

  const subjectId = url.searchParams.get("subjectId");
  if (!subjectId) {
    throw new ValidationError("subjectId query parameter is required");
  }

  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";

  const result = await spatialHistoryService.getHistory(tenantId, subjectId, {
    from,
    to,
    cursor,
    limit,
    order,
  });

  return ApiResponse.success(result.features, 200, {
    total: result.total,
    nextCursor: result.nextCursor,
    queryDurationMs: result.queryDurationMs,
  });
});
