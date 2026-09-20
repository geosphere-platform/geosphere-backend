import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleDashboardRepository } from "@/features/dashboard/infrastructure/drizzle-dashboard.repository";
import { DashboardBackendService } from "@/features/dashboard/application/dashboard.service";
import { PaginationQueryDto } from "@/features/dashboard/domain/dtos";

export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_READ)) {
    throw new ForbiddenError("Insufficient permissions to view recent alerts");
  }

  const { searchParams } = new URL(ctx.request.url);
  const query = PaginationQueryDto.parse({
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 10,
  });

  const repo = new DrizzleDashboardRepository(db);
  const service = new DashboardBackendService(repo);

  const result = await service.getRecentAlerts(
    query.page,
    query.limit,
    ctx.user.orgId,
  );
  return ApiResponse.success(result.items, 200, {
    total: result.total,
    page: result.page,
    limit: result.limit,
    hasMore: result.hasMore,
  });
});
