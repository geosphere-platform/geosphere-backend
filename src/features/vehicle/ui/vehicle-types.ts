/**
 * GeoSphere Platform — Vehicle Management Types & View Models
 *
 * Implements enterprise fleet management contracts, telemetry snapshots,
 * and filter structures conforming to the GeoSphere design standards.
 */

export type VehicleStatus =
  | "moving"
  | "idle"
  | "stopped"
  | "offline"
  | "active"
  | "inactive"
  | "maintenance";

export type VehicleType =
  | "truck"
  | "van"
  | "hauler"
  | "pickup"
  | "refrigerated"
  | "bus"
  | "container";

export interface VehicleItem {
  id: string;
  name: string;
  licensePlate: string;
  type: VehicleType;
  status: VehicleStatus;
  driverName?: string | null;
  driverPhone?: string | null;
  driverLicense?: string | null;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  fuelType?: "Diesel" | "Electric" | "CNG" | "Petrol";
  fuelPct?: number;
  batteryPct?: number;
  speed?: number; // km/h
  heading?: number;
  odometerKm?: number;
  latitude?: number;
  longitude?: number;
  currentAddress?: string;
  lastUpdated?: string;
  organizationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type VehicleStatusFilter =
  | "all"
  | "moving"
  | "idle"
  | "offline"
  | "maintenance";

export type VehicleViewMode = "grid" | "table";

export interface VehicleFilterState {
  searchQuery: string;
  status: VehicleStatusFilter;
  type: "all" | VehicleType;
  viewMode: VehicleViewMode;
}

export interface VehicleFleetStats {
  total: number;
  moving: number;
  idle: number;
  maintenance: number;
  offline: number;
  avgSpeed: number;
  fleetUtilizationPct: number;
}
