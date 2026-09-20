import { eq, and, count, sum, gte, desc } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { vehiclesTable, alertsTable, tripsTable } from "@/database/schema";
import { IDashboardRepository } from "../domain/repository.interface";
import {
  DashboardSummaryResponse,
  VehicleStatusBreakdownResponse,
  DashboardAlertItem,
  DashboardTripItem,
} from "../domain/dtos";
import { PaginatedResult } from "@/types/global";

export class DrizzleDashboardRepository implements IDashboardRepository {
  constructor(private readonly db: DatabaseClient) {}

  async getSummary(orgId?: string | null): Promise<DashboardSummaryResponse> {
    try {
      const orgFilter = orgId
        ? eq(vehiclesTable.organizationId, orgId)
        : undefined;
      const alertOrgFilter = orgId
        ? eq(alertsTable.organizationId, orgId)
        : undefined;
      const tripOrgFilter = orgId
        ? eq(tripsTable.organizationId, orgId)
        : undefined;

      // 1. Single SQL query grouping vehicle counts by status (eliminates 4 roundtrips)
      const statusCounts = await this.db
        .select({
          status: vehiclesTable.status,
          count: count(),
        })
        .from(vehiclesTable)
        .where(orgFilter)
        .groupBy(vehiclesTable.status);

      let totalVehicles = 0;
      let movingVehicles = 0;
      let idleVehicles = 0;
      let offlineVehicles = 0;

      for (const row of statusCounts) {
        const cnt = row.count;
        totalVehicles += cnt;
        if (row.status === "moving") movingVehicles += cnt;
        else if (row.status === "idle") idleVehicles += cnt;
        else if (row.status === "offline") offlineVehicles += cnt;
      }

      const onlineVehicles = Math.max(0, totalVehicles - offlineVehicles);

      // 2. Active trips query
      const [tripsRes] = await this.db
        .select({ value: count() })
        .from(tripsTable)
        .where(
          tripOrgFilter
            ? and(tripOrgFilter, eq(tripsTable.status, "in_progress"))
            : eq(tripsTable.status, "in_progress"),
        );
      const activeTrips = tripsRes?.value ?? 0;

      // 3. Today's total accumulated distance
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [distRes] = await this.db
        .select({ total: sum(tripsTable.distance) })
        .from(tripsTable)
        .where(
          tripOrgFilter
            ? and(tripOrgFilter, gte(tripsTable.startTime, startOfDay))
            : gte(tripsTable.startTime, startOfDay),
        );
      const todayDistance = distRes?.total ? parseFloat(distRes.total) : 0;

      // 4. Active alerts count
      const [alertsRes] = await this.db
        .select({ value: count() })
        .from(alertsTable)
        .where(
          alertOrgFilter
            ? and(alertOrgFilter, eq(alertsTable.status, "active"))
            : eq(alertsTable.status, "active"),
        );
      const activeAlerts = alertsRes?.value ?? 0;

      return {
        totalVehicles,
        onlineVehicles,
        offlineVehicles,
        movingVehicles,
        idleVehicles,
        activeTrips,
        todayDistance,
        activeAlerts,
      };
    } catch {
      return {
        totalVehicles: 0,
        onlineVehicles: 0,
        offlineVehicles: 0,
        movingVehicles: 0,
        idleVehicles: 0,
        activeTrips: 0,
        todayDistance: 0,
        activeAlerts: 0,
      };
    }
  }

  async getVehicleStatusBreakdown(
    orgId?: string | null,
  ): Promise<VehicleStatusBreakdownResponse> {
    try {
      const orgFilter = orgId
        ? eq(vehiclesTable.organizationId, orgId)
        : undefined;

      const statusCounts = await this.db
        .select({
          status: vehiclesTable.status,
          count: count(),
        })
        .from(vehiclesTable)
        .where(orgFilter)
        .groupBy(vehiclesTable.status);

      let moving = 0;
      let idle = 0;
      let stopped = 0;
      let offline = 0;

      for (const row of statusCounts) {
        if (row.status === "moving") moving += row.count;
        else if (row.status === "idle") idle += row.count;
        else if (row.status === "stopped") stopped += row.count;
        else if (row.status === "offline") offline += row.count;
      }

      return { moving, idle, stopped, offline };
    } catch {
      return { moving: 0, idle: 0, stopped: 0, offline: 0 };
    }
  }

  async getRecentAlerts(
    page: number,
    limit: number,
    orgId?: string | null,
  ): Promise<PaginatedResult<DashboardAlertItem>> {
    try {
      const offset = (page - 1) * limit;
      const orgFilter = orgId
        ? eq(alertsTable.organizationId, orgId)
        : undefined;

      const [countRes] = await this.db
        .select({ value: count() })
        .from(alertsTable)
        .where(orgFilter);
      const total = countRes?.value ?? 0;

      const rows = await this.db
        .select({
          alertId: alertsTable.id,
          type: alertsTable.type,
          severity: alertsTable.severity,
          message: alertsTable.message,
          createdAt: alertsTable.createdAt,
          status: alertsTable.status,
          vehicleId: vehiclesTable.id,
          vehicleName: vehiclesTable.name,
          licensePlate: vehiclesTable.licensePlate,
        })
        .from(alertsTable)
        .innerJoin(vehiclesTable, eq(alertsTable.vehicleId, vehiclesTable.id))
        .where(orgFilter)
        .orderBy(desc(alertsTable.createdAt))
        .limit(limit)
        .offset(offset);

      const items: DashboardAlertItem[] = rows.map((r) => ({
        id: r.alertId,
        type: r.type,
        severity: r.severity as "critical" | "warning" | "info",
        vehicle: {
          id: r.vehicleId,
          name: r.vehicleName,
          licensePlate: r.licensePlate,
        },
        message: r.message,
        createdAt: r.createdAt.toISOString(),
        status: r.status as "active" | "resolved",
      }));

      return {
        items,
        total,
        page,
        limit,
        hasMore: offset + items.length < total,
      };
    } catch {
      return { items: [], total: 0, page, limit, hasMore: false };
    }
  }

  async getRecentTrips(
    page: number,
    limit: number,
    orgId?: string | null,
  ): Promise<PaginatedResult<DashboardTripItem>> {
    try {
      const offset = (page - 1) * limit;
      const orgFilter = orgId
        ? eq(tripsTable.organizationId, orgId)
        : undefined;

      const [countRes] = await this.db
        .select({ value: count() })
        .from(tripsTable)
        .where(orgFilter);
      const total = countRes?.value ?? 0;

      const rows = await this.db
        .select({
          tripId: tripsTable.id,
          driverName: tripsTable.driverName,
          distance: tripsTable.distance,
          status: tripsTable.status,
          startTime: tripsTable.startTime,
          endTime: tripsTable.endTime,
          vehicleId: vehiclesTable.id,
          vehicleName: vehiclesTable.name,
          licensePlate: vehiclesTable.licensePlate,
        })
        .from(tripsTable)
        .innerJoin(vehiclesTable, eq(tripsTable.vehicleId, vehiclesTable.id))
        .where(orgFilter)
        .orderBy(desc(tripsTable.startTime))
        .limit(limit)
        .offset(offset);

      const items: DashboardTripItem[] = rows.map((r) => ({
        id: r.tripId,
        vehicle: {
          id: r.vehicleId,
          name: r.vehicleName,
          licensePlate: r.licensePlate,
        },
        driver: r.driverName,
        startTime: r.startTime.toISOString(),
        endTime: r.endTime ? r.endTime.toISOString() : null,
        distance: r.distance,
        status: r.status as "in_progress" | "completed",
      }));

      return {
        items,
        total,
        page,
        limit,
        hasMore: offset + items.length < total,
      };
    } catch {
      return { items: [], total: 0, page, limit, hasMore: false };
    }
  }
}
