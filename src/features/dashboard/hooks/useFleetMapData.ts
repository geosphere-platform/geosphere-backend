"use client";

import { useState, useCallback, useEffect } from "react";
import { MapVehicleMarker } from "../types/fleet";
import { MOCK_VEHICLE_MARKERS } from "../mock/mockFleetData";
import { DashboardService } from "../services/dashboard.service";

export interface UseFleetMapDataReturn {
  markers: MapVehicleMarker[];
  selectedMarker: MapVehicleMarker | null;
  isClusteringEnabled: boolean;
  activeTileLayer: "street" | "dark" | "satellite";
  isLoading: boolean;
  setSelectedMarker: (marker: MapVehicleMarker | null) => void;
  toggleClustering: () => void;
  setActiveTileLayer: (layer: "street" | "dark" | "satellite") => void;
  refetchPositions: () => Promise<void>;
}

export function useFleetMapData(): UseFleetMapDataReturn {
  const [markers, setMarkers] =
    useState<MapVehicleMarker[]>(MOCK_VEHICLE_MARKERS);
  const [selectedMarker, setSelectedMarker] = useState<MapVehicleMarker | null>(
    null,
  );
  const [isClusteringEnabled, setIsClusteringEnabled] = useState<boolean>(true);
  const [activeTileLayer, setActiveTileLayer] = useState<
    "street" | "dark" | "satellite"
  >("street");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const toggleClustering = useCallback(() => {
    setIsClusteringEnabled((prev) => !prev);
  }, []);

  const refetchPositions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await DashboardService.fetchLiveVehicles();
      if (Array.isArray(data) && data.length > 0) {
        setMarkers(data);
      }
    } catch {
      // Fallback to mock positions if database fresh
      setMarkers(MOCK_VEHICLE_MARKERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      if (isSubscribed) {
        await refetchPositions();
      }
    };
    load();
    return () => {
      isSubscribed = false;
    };
  }, [refetchPositions]);

  return {
    markers,
    selectedMarker,
    isClusteringEnabled,
    activeTileLayer,
    isLoading,
    setSelectedMarker,
    toggleClustering,
    setActiveTileLayer,
    refetchPositions,
  };
}
