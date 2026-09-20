"use client";

import { useEffect } from "react";
import { GISMap, MapMarker } from "@gis/map";
import { LiveVehicleData } from "./useLiveTracking";

interface VehicleTrackingMapProps {
  map: GISMap | any;
  vehicles: LiveVehicleData[];
  selectedVehicleId: string | null;
  onSelectVehicle?: (vehicleId: string) => void;
}

export function VehicleTrackingMap({
  map,
  vehicles,
  selectedVehicleId,
}: VehicleTrackingMapProps) {
  useEffect(() => {
    if (!map) return;

    // Check if map is a GISMap instance or contains features manager
    const featureManager = map.features || (map.getFeatures ? map : null);
    if (!featureManager) return;

    // Clear existing features
    map.features?.clearFeatures();

    const markers: MapMarker[] = vehicles
      .filter((v) => !!v.latestTelemetry)
      .map(({ vehicle, latestTelemetry }) => {
        const isSelected = vehicle.id === selectedVehicleId;
        return {
          id: vehicle.id,
          coordinate: [latestTelemetry!.longitude, latestTelemetry!.latitude],
          title: vehicle.name,
          metadata: {
            vehicleId: vehicle.id,
            speed: latestTelemetry!.speed,
            heading: latestTelemetry!.heading,
          },
          style: {
            circleRadius: isSelected ? 10 : 7,
            fillColor: isSelected
              ? "#ef4444"
              : vehicle.status === "active"
                ? "#22c55e"
                : "#eab308",
            strokeColor: "#ffffff",
            strokeWidth: isSelected ? 3 : 2,
          },
        };
      });

    markers.forEach((marker) => {
      if (map.addMarker) {
        map.addMarker(marker);
      }
    });

    return () => {
      map.features?.clearFeatures();
    };
  }, [map, vehicles, selectedVehicleId]);

  return null;
}
