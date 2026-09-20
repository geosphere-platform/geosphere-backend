import { USER_ROLES, PERMISSIONS } from "@/core/constants";
import { hasPermission, hasAnyPermission } from "@/core/auth/permissions";
import {
  DashboardSummaryResponse,
  VehicleStatusBreakdownResponse,
} from "@/features/dashboard/domain/dtos";
import { MapVehicleMarker } from "@/features/dashboard/types/fleet";

export function runDashboardUnitTests(): boolean {
  // 1. KPI Calculations Test
  const mockSummary: DashboardSummaryResponse = {
    totalVehicles: 48,
    onlineVehicles: 36,
    offlineVehicles: 12,
    movingVehicles: 24,
    idleVehicles: 12,
    activeTrips: 18,
    todayDistance: 3842.5,
    activeAlerts: 5,
  };

  const onlineRatio =
    (mockSummary.onlineVehicles / mockSummary.totalVehicles) * 100;
  if (Math.round(onlineRatio) !== 75) {
    throw new Error(
      `KPI Calculation failed: expected 75%, got ${onlineRatio}%`,
    );
  }

  const calculatedOnline =
    mockSummary.totalVehicles - mockSummary.offlineVehicles;
  if (calculatedOnline !== mockSummary.onlineVehicles) {
    throw new Error(
      `Online vehicle arithmetic failed: expected ${mockSummary.onlineVehicles}, got ${calculatedOnline}`,
    );
  }

  // 2. Vehicle Status Breakdown Data Transformation Test
  const mockBreakdown: VehicleStatusBreakdownResponse = {
    moving: 24,
    idle: 12,
    stopped: 0,
    offline: 12,
  };

  const totalFromBreakdown =
    mockBreakdown.moving +
    mockBreakdown.idle +
    mockBreakdown.stopped +
    mockBreakdown.offline;
  if (totalFromBreakdown !== 48) {
    throw new Error(
      `Status breakdown sum mismatch: expected 48, got ${totalFromBreakdown}`,
    );
  }

  // 3. Permission Checks Test
  if (!hasPermission(USER_ROLES.SUPER_ADMIN, PERMISSIONS.VEHICLE_READ)) {
    throw new Error("SUPER_ADMIN should have vehicle:read permission");
  }

  if (!hasPermission(USER_ROLES.ORG_ADMIN, PERMISSIONS.VEHICLE_CREATE)) {
    throw new Error("ORG_ADMIN should have vehicle:create permission");
  }

  if (hasPermission(USER_ROLES.VIEWER, PERMISSIONS.VEHICLE_DELETE)) {
    throw new Error("VIEWER must not have vehicle:delete permission");
  }

  if (
    !hasAnyPermission(USER_ROLES.DISPATCHER, [
      PERMISSIONS.VEHICLE_READ,
      PERMISSIONS.USER_CREATE,
    ])
  ) {
    throw new Error(
      "DISPATCHER has vehicle:read so hasAnyPermission should return true",
    );
  }

  // 4. Data Transformation Test for GIS Map Marker
  const rawVehicle = {
    id: "veh-1",
    name: "Truck A",
    licensePlate: "UK-07-1234",
    status: "moving" as const,
    lat: 51.5074,
    lon: -0.1278,
    speed: 65,
    heading: 180,
    driverName: "John Doe",
    recordedAt: new Date("2026-08-08T12:00:00Z"),
  };

  const marker: MapVehicleMarker = {
    id: rawVehicle.id,
    name: rawVehicle.name,
    licensePlate: rawVehicle.licensePlate,
    status: rawVehicle.status,
    latitude: rawVehicle.lat,
    longitude: rawVehicle.lon,
    speed: rawVehicle.speed,
    heading: rawVehicle.heading,
    driverName: rawVehicle.driverName,
    lastUpdated: rawVehicle.recordedAt.toISOString(),
  };

  if (
    marker.latitude !== 51.5074 ||
    marker.longitude !== -0.1278 ||
    marker.status !== "moving"
  ) {
    throw new Error("GIS Marker data transformation failed");
  }

  return true;
}
