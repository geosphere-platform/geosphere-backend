import {
  DashboardSummaryResponse,
  VehicleStatusBreakdownResponse,
  DashboardAlertItem,
  DashboardTripItem,
} from "./dtos";
import { PaginatedResult } from "@/types/global";

export interface IDashboardRepository {
  getSummary(orgId?: string | null): Promise<DashboardSummaryResponse>;
  getVehicleStatusBreakdown(
    orgId?: string | null,
  ): Promise<VehicleStatusBreakdownResponse>;
  getRecentAlerts(
    page: number,
    limit: number,
    orgId?: string | null,
  ): Promise<PaginatedResult<DashboardAlertItem>>;
  getRecentTrips(
    page: number,
    limit: number,
    orgId?: string | null,
  ): Promise<PaginatedResult<DashboardTripItem>>;
}
