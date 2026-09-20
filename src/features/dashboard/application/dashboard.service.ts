import { IDashboardRepository } from "../domain/repository.interface";
import {
  DashboardSummaryResponse,
  VehicleStatusBreakdownResponse,
  DashboardAlertItem,
  DashboardTripItem,
} from "../domain/dtos";
import { PaginatedResult } from "@/types/global";

export class DashboardBackendService {
  constructor(private readonly dashboardRepository: IDashboardRepository) {}

  async getSummary(orgId?: string | null): Promise<DashboardSummaryResponse> {
    return this.dashboardRepository.getSummary(orgId);
  }

  async getVehicleStatusBreakdown(
    orgId?: string | null,
  ): Promise<VehicleStatusBreakdownResponse> {
    return this.dashboardRepository.getVehicleStatusBreakdown(orgId);
  }

  async getRecentAlerts(
    page: number,
    limit: number,
    orgId?: string | null,
  ): Promise<PaginatedResult<DashboardAlertItem>> {
    return this.dashboardRepository.getRecentAlerts(page, limit, orgId);
  }

  async getRecentTrips(
    page: number,
    limit: number,
    orgId?: string | null,
  ): Promise<PaginatedResult<DashboardTripItem>> {
    return this.dashboardRepository.getRecentTrips(page, limit, orgId);
  }
}
