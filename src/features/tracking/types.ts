/**
 * GeoSphere Platform — Live Tracking Domain Types & Data Contracts
 *
 * Implements GIS industry-standard live telemetry models, breadcrumb structures,
 * and user-friendly fleet operational metrics.
 */

import { MapVehicleMarker, VehicleStatus } from "@/features/dashboard/types/fleet";

export type LiveTrackingStatus = "moving" | "idle" | "offline" | "overspeed";

export interface LiveBreadcrumbPoint {
  id: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  timestamp: string;
  altitudeMeters?: number;
}

export interface LiveTrackingEntity extends MapVehicleMarker {
  batteryPct: number;
  fuelPct?: number;
  odometerKm?: number;
  altitudeMeters: number;
  ignition: "ON" | "OFF";
  signalStrength: number; // 1 to 5
  geofenceName?: string;
  geofenceStatus?: "inside" | "outside" | "entered" | "exited";
  currentAddress?: string;
  driverPhone?: string;
  breadcrumbTrail: LiveBreadcrumbPoint[];
  overspeedAlert?: boolean;
}

export interface FleetTrackingMetrics {
  total: number;
  moving: number;
  idle: number;
  offline: number;
  overspeed: number;
  avgSpeedKmh: number;
  activeAlertsCount: number;
}

export type TrackingStatusFilter = "all" | "moving" | "idle" | "offline";

export interface TrackingFilterState {
  status: TrackingStatusFilter;
  searchQuery: string;
  showBreadcrumbs: boolean;
  showGeofences: boolean;
  followSelected: boolean;
  simulationActive: boolean;
  activeBasemap: "street" | "dark" | "satellite";
}

export interface UserLiveLocation {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: string;
  isRealGps: boolean;
  address?: string;
}

export const DEFAULT_INDIA_CENTER = {
  latitude: 21.1458,
  longitude: 79.0882,
  zoom: 12,
  country: "India",
  region: "Central India (Nagpur Zero Mile Hub)",
} as const;


