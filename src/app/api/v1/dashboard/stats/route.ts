import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors/errors";
import { db } from "@/database";
import { vehiclesTable } from "@/database/schema";
import { count, eq, and } from "drizzle-orm";

export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_READ)) {
    throw new ForbiddenError(
      "Insufficient permission to view vehicle dashboard statistics",
    );
  }

  try {
    const orgFilter = ctx.user.orgId
      ? eq(vehiclesTable.organizationId, ctx.user.orgId)
      : undefined;

    const [totalRes] = await db
      .select({ value: count() })
      .from(vehiclesTable)
      .where(orgFilter);

    const activeCondition = orgFilter
      ? and(orgFilter, eq(vehiclesTable.status, "active"))
      : eq(vehiclesTable.status, "active");

    const [activeRes] = await db
      .select({ value: count() })
      .from(vehiclesTable)
      .where(activeCondition);

    const totalVehicles = totalRes?.value ?? 0;
    const activeVehicles = activeRes?.value ?? 0;

    return ApiResponse.success(
      {
        totalVehicles,
        activeVehicles,
        stationaryVehicles: Math.max(0, totalVehicles - activeVehicles),
        maintenanceVehicles: 0,
        totalDistanceKm: 0,
        activeAlerts: 0,
      },
      200,
    );
  } catch {
    return ApiResponse.success(
      {
        totalVehicles: 0,
        activeVehicles: 0,
        stationaryVehicles: 0,
        maintenanceVehicles: 0,
        totalDistanceKm: 0,
        activeAlerts: 0,
      },
      200,
    );
  }
});
