export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  status:
    | "moving"
    | "idle"
    | "stopped"
    | "offline"
    | "active"
    | "inactive"
    | "maintenance";
  organizationId?: string | null;
  driverName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TelemetryLog {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number; // in km/h
  heading: number; // 0 to 360 degrees
  timestamp: Date;
}
