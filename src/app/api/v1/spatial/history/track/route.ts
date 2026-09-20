import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { spatialHistoryService } from "../../query-shared";

/**
 * GET /api/v1/spatial/history/track
 * Generates a spatial track (GeoJSON LineString) and summary stats for a subject.
 */
export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_HISTORY_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:history:read' required for track query",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const url = new URL(ctx.request.url);

  const subjectId = url.searchParams.get("subjectId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!subjectId || !from || !to) {
    throw new ValidationError(
      "subjectId, from, and to query parameters are required",
    );
  }

  const track = await spatialHistoryService.getTrack(
    tenantId,
    subjectId,
    from,
    to,
  );
  const speedStats = await spatialHistoryService.getSpeedStats(
    tenantId,
    subjectId,
    from,
    to,
  );

  return ApiResponse.success(
    {
      track,
      speedStats,
    },
    200,
  );
});
