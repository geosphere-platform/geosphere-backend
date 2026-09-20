import { z } from "zod";

export const PaginationQueryDto = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type PaginationQueryDtoType = z.infer<typeof PaginationQueryDto>;

export interface DashboardSummaryResponse {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  activeTrips: number;
  todayDistance: number;
  activeAlerts: number;
}

export interface VehicleStatusBreakdownResponse {
  moving: number;
  idle: number;
  stopped: number;
  offline: number;
}

export interface DashboardAlertItem {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  vehicle: {
    id: string;
    name: string;
    licensePlate: string;
  };
  message: string;
  createdAt: string;
  status: "active" | "resolved";
}

export interface DashboardTripItem {
  id: string;
  vehicle: {
    id: string;
    name: string;
    licensePlate: string;
  };
  driver: string;
  startTime: string;
  endTime: string | null;
  distance: number;
  status: "in_progress" | "completed";
}
