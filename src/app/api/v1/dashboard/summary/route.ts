import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleDashboardRepository } from "@/features/dashboard/infrastructure/drizzle-dashboard.repository";
import { DashboardBackendService } from "@/features/dashboard/application/dashboard.service";

export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_READ)) {
    throw new ForbiddenError(
      "Insufficient permissions to view dashboard summary",
    );
  }

  const repo = new DrizzleDashboardRepository(db);
  const service = new DashboardBackendService(repo);

  const summary = await service.getSummary(ctx.user.orgId);
  return ApiResponse.success(summary, 200);
});
