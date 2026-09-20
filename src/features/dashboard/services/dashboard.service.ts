import { Permission } from "@/core/constants";
import { UserProfile, DashboardStats } from "../types";
import {
  DashboardSummaryResponse,
  VehicleStatusBreakdownResponse,
  DashboardAlertItem,
  DashboardTripItem,
} from "../domain/dtos";

export interface AuthMeResponse {
  user: UserProfile;
  permissions: Permission[];
}

function getAuthHeaders(providedToken?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const token =
    providedToken ||
    (typeof window !== "undefined"
      ? localStorage.getItem("gis_access_token")
      : null);

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export class DashboardService {
  /**
   * Fetches current authenticated user profile and permissions from /api/v1/auth/me
   */
  static async fetchCurrentUser(accessToken?: string): Promise<AuthMeResponse> {
    const res = await fetch("/api/v1/auth/me", {
      method: "GET",
      headers: getAuthHeaders(accessToken),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Authentication failed with status ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch user session");
    }

    return json.data;
  }

  /**
   * Fetches dashboard summary statistics from /api/v1/dashboard/summary
   */
  static async fetchSummary(
    accessToken?: string,
  ): Promise<DashboardSummaryResponse> {
    const res = await fetch("/api/v1/dashboard/summary", {
      method: "GET",
      headers: getAuthHeaders(accessToken),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch dashboard summary: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(
        json.error?.message || "Failed to fetch dashboard summary",
      );
    }

    return json.data;
  }

  /**
   * Fetches vehicle status breakdown from /api/v1/dashboard/vehicle-status
   */
  static async fetchVehicleStatus(
    accessToken?: string,
  ): Promise<VehicleStatusBreakdownResponse> {
    const res = await fetch("/api/v1/dashboard/vehicle-status", {
      method: "GET",
      headers: getAuthHeaders(accessToken),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch vehicle status: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch vehicle status");
    }

    return json.data;
  }

  /**
   * Fetches recent vehicle alerts from /api/v1/dashboard/recent-alerts
   */
  static async fetchRecentAlerts(
    page: number = 1,
    limit: number = 10,
    accessToken?: string,
  ): Promise<DashboardAlertItem[]> {
    const res = await fetch(
      `/api/v1/dashboard/recent-alerts?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(accessToken),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch recent alerts: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch recent alerts");
    }

    return json.data;
  }

  /**
   * Fetches recent fleet trips from /api/v1/dashboard/recent-trips
   */
  static async fetchRecentTrips(
    page: number = 1,
    limit: number = 10,
    accessToken?: string,
  ): Promise<DashboardTripItem[]> {
    const res = await fetch(
      `/api/v1/dashboard/recent-trips?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: getAuthHeaders(accessToken),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch recent trips: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error?.message || "Failed to fetch recent trips");
    }

    return json.data;
  }

  /**
   * Fetches live map vehicle coordinates from /api/v1/vehicles/live
   */
  static async fetchLiveVehicles(accessToken?: string) {
    const res = await fetch("/api/v1/vehicles/live", {
      method: "GET",
      headers: getAuthHeaders(accessToken),
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(
        `Failed to fetch live vehicle locations: HTTP ${res.status}`,
      );
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(
        json.error?.message || "Failed to fetch live vehicle locations",
      );
    }

    return json.data;
  }

  /**
   * Legacy wrapper for stats
   */
  static async fetchDashboardStats(
    accessToken?: string,
  ): Promise<DashboardStats> {
    const summary = await this.fetchSummary(accessToken);
    return {
      totalVehicles: summary.totalVehicles,
      activeVehicles: summary.onlineVehicles,
      stationaryVehicles: summary.idleVehicles,
      maintenanceVehicles: 0,
      totalDistanceKm: summary.todayDistance,
      activeAlerts: summary.activeAlerts,
    };
  }
}
