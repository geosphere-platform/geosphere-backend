export type VehicleStatus =
  "online" | "moving" | "idle" | "stopped" | "offline";

export interface MapVehicleMarker {
  id: string;
  name: string;
  licensePlate: string;
  status: VehicleStatus;
  latitude: number;
  longitude: number;
  speed: number; // in km/h
  heading: number; // in degrees (0-360)
  driverName: string;
  lastUpdated: string;
}

export interface KpiTrend {
  value: string;
  isPositive: boolean;
}

export interface KpiItemData {
  id:
    | "total"
    | "online"
    | "moving"
    | "idle"
    | "offline"
    | "trips"
    | "distance"
    | "alerts";
  label: string;
  value: string | number;
  trend?: KpiTrend;
  colorTheme:
    | "blue"
    | "emerald"
    | "green"
    | "amber"
    | "gray"
    | "indigo"
    | "purple"
    | "red";
}

export interface FleetAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  type: "overspeed" | "geofence" | "panic" | "maintenance";
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface FleetTrip {
  id: string;
  vehicleId: string;
  vehicleName: string;
  driverName: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  status: "in_progress" | "completed";
  startedAt: string;
}

export interface SystemEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: "user" | "geofence" | "vehicle" | "system";
}
