"use client";

import { useState, useCallback, useEffect } from "react";
import {
  KpiItemData,
  FleetAlert,
  FleetTrip,
  SystemEvent,
} from "../types/fleet";
import { DashboardService } from "../services/dashboard.service";
import {
  MOCK_KPI_DATA,
  MOCK_RECENT_ALERTS,
  MOCK_RECENT_TRIPS,
  MOCK_SYSTEM_EVENTS,
} from "../mock/mockFleetData";

export interface UseFleetDashboardReturn {
  kpis: KpiItemData[];
  alerts: FleetAlert[];
  trips: FleetTrip[];
  events: SystemEvent[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => Promise<void>;
}

export function useFleetDashboard(): UseFleetDashboardReturn {
  const [kpis, setKpis] = useState<KpiItemData[]>(MOCK_KPI_DATA);
  const [alerts, setAlerts] = useState<FleetAlert[]>(MOCK_RECENT_ALERTS);
  const [trips, setTrips] = useState<FleetTrip[]>(MOCK_RECENT_TRIPS);
  const [events, setEvents] = useState<SystemEvent[]>(MOCK_SYSTEM_EVENTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    try {
      // Parallel server queries (Promise.all)
      const [summaryRes, alertsRes, tripsRes] = await Promise.allSettled([
        DashboardService.fetchSummary(),
        DashboardService.fetchRecentAlerts(1, 5),
        DashboardService.fetchRecentTrips(1, 5),
      ]);

      if (summaryRes.status === "fulfilled") {
        const s = summaryRes.value;
        setKpis([
          {
            id: "total",
            label: "Total Vehicles",
            value: s.totalVehicles,
            trend: { value: "Registered", isPositive: true },
            colorTheme: "blue",
          },
          {
            id: "online",
            label: "Online Vehicles",
            value: s.onlineVehicles,
            trend: {
              value: `${s.totalVehicles > 0 ? Math.round((s.onlineVehicles / s.totalVehicles) * 100) : 0}% of fleet`,
              isPositive: true,
            },
            colorTheme: "emerald",
          },
          {
            id: "moving",
            label: "Moving Vehicles",
            value: s.movingVehicles,
            trend: { value: "In transit", isPositive: true },
            colorTheme: "green",
          },
          {
            id: "idle",
            label: "Idle Vehicles",
            value: s.idleVehicles,
            trend: { value: "Engine running", isPositive: false },
            colorTheme: "amber",
          },
          {
            id: "offline",
            label: "Offline Vehicles",
            value: s.offlineVehicles,
            trend: { value: "No signal", isPositive: false },
            colorTheme: "gray",
          },
          {
            id: "trips",
            label: "Active Trips",
            value: s.activeTrips,
            trend: { value: "Ongoing", isPositive: true },
            colorTheme: "indigo",
          },
          {
            id: "distance",
            label: "Today's Distance",
            value: `${s.todayDistance} km`,
            trend: { value: "Accumulated", isPositive: true },
            colorTheme: "purple",
          },
          {
            id: "alerts",
            label: "Active Alerts",
            value: s.activeAlerts,
            trend: {
              value: s.activeAlerts > 0 ? "Requires action" : "All clear",
              isPositive: s.activeAlerts === 0,
            },
            colorTheme: "red",
          },
        ]);
      }

      if (alertsRes.status === "fulfilled" && alertsRes.value.length > 0) {
        setAlerts(
          alertsRes.value.map((a) => ({
            id: a.id,
            vehicleId: a.vehicle.id,
            vehicleName: a.vehicle.name,
            licensePlate: a.vehicle.licensePlate,
            type: a.type as FleetAlert["type"],
            severity: a.severity,
            message: a.message,
            timestamp: new Date(a.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            resolved: a.status === "resolved",
          })),
        );
      }

      if (tripsRes.status === "fulfilled" && tripsRes.value.length > 0) {
        setTrips(
          tripsRes.value.map((t) => ({
            id: t.id,
            vehicleId: t.vehicle.id,
            vehicleName: t.vehicle.name,
            driverName: t.driver,
            origin: "Depot Station",
            destination: "Destination Hub",
            distanceKm: t.distance,
            durationMinutes: 45,
            status: t.status,
            startedAt: new Date(t.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        );
      }

      setEvents(MOCK_SYSTEM_EVENTS);
    } catch (err) {
      setIsError(true);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to load real dashboard metrics",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      if (isSubscribed) {
        await fetchDashboardData();
      }
    };
    load();
    return () => {
      isSubscribed = false;
    };
  }, [fetchDashboardData]);

  return {
    kpis,
    alerts,
    trips,
    events,
    isLoading,
    isError,
    errorMessage,
    refetch: fetchDashboardData,
  };
}
