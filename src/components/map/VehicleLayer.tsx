import { MapMarker, markerToFeature } from "@gis/map";
import { MapVehicleMarker } from "@/features/dashboard/types/fleet";

export function getStatusColor(status: MapVehicleMarker["status"]): string {
  switch (status) {
    case "moving":
      return "#10B981"; // Emerald green
    case "idle":
      return "#F59E0B"; // Amber
    case "stopped":
      return "#EF4444"; // Red
    case "offline":
    default:
      return "#64748B"; // Slate gray
  }
}

export function createVehicleMarkerSDK(marker: MapVehicleMarker): MapMarker {
  return {
    id: marker.id,
    coordinate: [marker.longitude, marker.latitude],
    title: marker.name,
    metadata: { markerData: marker, status: marker.status },
    style: {
      circleRadius: 9,
      fillColor: getStatusColor(marker.status),
      strokeColor: "#FFFFFF",
      strokeWidth: 2.5,
    },
  };
}

export function createVehicleFeature(marker: MapVehicleMarker) {
  const sdkMarker = createVehicleMarkerSDK(marker);
  return markerToFeature(sdkMarker);
}
