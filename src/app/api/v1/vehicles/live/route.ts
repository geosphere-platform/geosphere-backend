import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors/errors";
import { db } from "@/database";
import { vehiclesTable, vehicleTelemetryTable } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { MapVehicleMarker } from "@/features/dashboard/types/fleet";

export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_READ)) {
    throw new ForbiddenError("Insufficient permissions to view live vehicles");
  }

  try {
    const orgFilter = ctx.user.orgId
      ? eq(vehiclesTable.organizationId, ctx.user.orgId)
      : undefined;

    const rows = await db
      .select({
        id: vehiclesTable.id,
        name: vehiclesTable.name,
        licensePlate: vehiclesTable.licensePlate,
        status: vehiclesTable.status,
        driverName: vehiclesTable.driverName,
        lat: vehicleTelemetryTable.latitude,
        lon: vehicleTelemetryTable.longitude,
        speed: vehicleTelemetryTable.speed,
        heading: vehicleTelemetryTable.heading,
        recordedAt: vehicleTelemetryTable.recordedAt,
      })
      .from(vehiclesTable)
      .leftJoin(
        vehicleTelemetryTable,
        eq(vehiclesTable.id, vehicleTelemetryTable.vehicleId),
      )
      .where(orgFilter)
      .orderBy(desc(vehicleTelemetryTable.recordedAt));

    const markers: MapVehicleMarker[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      licensePlate: r.licensePlate,
      status: (r.status as MapVehicleMarker["status"]) || "offline",
      latitude: r.lat ?? 51.5074,
      longitude: r.lon ?? -0.1278,
      speed: r.speed ?? 0,
      heading: r.heading ?? 0,
      driverName: r.driverName ?? "Unassigned",
      lastUpdated: r.recordedAt ? r.recordedAt.toISOString() : "No telemetry",
    }));

    return ApiResponse.success(markers, 200);
  } catch {
    return ApiResponse.success([], 200);
  }
});
