/**
 * GeoSphere Platform — Geofence Management Types & View Models
 *
 * Implements non-technical, human-friendly virtual boundaries,
 * circular radius models, and live vehicle presence detection.
 */

export type GeofenceCategory =
  | "depot"
  | "customer"
  | "restricted"
  | "terminal"
  | "service";

export type GeofenceShapeType = "circle" | "polygon" | "admin_region";

export type AdminBoundaryLevel = "country" | "state" | "district" | "tehsil";

export interface AdminRegionMetadata {
  level: AdminBoundaryLevel;
  countryCode: string;
  stateCode?: string;
  districtId?: string;
  tehsilId?: string;
  adminName: string;
  areaSqKm: number;
  perimeterKm?: number;
}

export interface AlertTriggers {
  onEnter: boolean;
  onExit: boolean;
  onDwell?: boolean;
  dwellMinutes?: number;
  maxSpeedKmh?: number;
}

export interface GeofenceZoneItem {
  id: string;
  name: string;
  description?: string;
  category: GeofenceCategory;
  color: string;
  shapeType: GeofenceShapeType;
  center: [number, number]; // [longitude, latitude]
  radiusMeters?: number;
  coordinates: [number, number][]; // Polygon outer boundary ring [lon, lat][]
  enabled: boolean;
  activeVehiclesCount: number;
  activeVehiclePlates: string[];
  alertTriggers: AlertTriggers;
  areaHectares?: number;
  adminRegion?: AdminRegionMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeofenceStats {
  total: number;
  active: number;
  vehiclesInside: number;
  alertsToday: number;
}

export interface GeofenceFilterState {
  searchQuery: string;
  category: "all" | GeofenceCategory;
  shape: "all" | GeofenceShapeType;
}

export const GEOFENCE_CATEGORY_METADATA: Record<
  GeofenceCategory,
  { label: string; icon: string; defaultColor: string; description: string }
> = {
  depot: {
    label: "Depot & Warehouse",
    icon: "🏭",
    defaultColor: "#10b981",
    description: "Company yards, loading docks, and primary distribution hubs",
  },
  customer: {
    label: "Customer Site",
    icon: "🏢",
    defaultColor: "#f59e0b",
    description: "Client delivery addresses, partner facilities, and consignees",
  },
  restricted: {
    label: "Restricted Zone",
    icon: "🛑",
    defaultColor: "#ef4444",
    description: "No-go zones, toll-evasion routes, or hazardous areas",
  },
  terminal: {
    label: "Logistics Terminal",
    icon: "✈️",
    defaultColor: "#3b82f6",
    description: "Airports, rail freight depots, and multi-modal ports",
  },
  service: {
    label: "Fuel & Service Bay",
    icon: "⛽",
    defaultColor: "#8b5cf6",
    description: "Approved fueling stations, workshops, and maintenance bays",
  },
};
