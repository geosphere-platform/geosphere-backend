"use client";

import { useState, useEffect, useCallback } from "react";
import { Vehicle, TelemetryLog } from "../domain/entities";

export interface LiveVehicleData {
  vehicle: Vehicle;
  latestTelemetry: TelemetryLog | null;
}

export function useLiveTracking(pollingIntervalMs: number = 5000) {
  const [vehicles, setVehicles] = useState<LiveVehicleData[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveFleet = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/vehicles/live");
      if (!res.ok) {
        throw new Error(`Failed to fetch live tracking data (${res.status})`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setVehicles(json.data);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Live tracking error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const runFetch = async () => {
      if (isMounted) {
        await fetchLiveFleet();
      }
    };

    runFetch();
    const interval = setInterval(runFetch, pollingIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchLiveFleet, pollingIntervalMs]);

  const selectedVehicle =
    vehicles.find((v) => v.vehicle.id === selectedVehicleId) ?? null;

  return {
    vehicles,
    selectedVehicleId,
    selectedVehicle,
    setSelectedVehicleId,
    loading,
    error,
    refresh: fetchLiveFleet,
  };
}
