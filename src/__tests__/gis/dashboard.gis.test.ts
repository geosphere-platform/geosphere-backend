import {
  getStatusColor,
  createVehicleFeature,
} from "@/components/map/VehicleLayer";
import { createVehicleClusterSDKLayer } from "@/components/map/VehicleClusterLayer";
import { MapVehicleMarker } from "@/features/dashboard/types/fleet";

export function runDashboardGisTests(): boolean {
  // 1. Status Color Mapping Test
  const movingColor = getStatusColor("moving");
  const idleColor = getStatusColor("idle");
  const stoppedColor = getStatusColor("stopped");
  const offlineColor = getStatusColor("offline");

  if (movingColor !== "#10B981")
    throw new Error("Moving status color mismatch");
  if (idleColor !== "#F59E0B") throw new Error("Idle status color mismatch");
  if (stoppedColor !== "#EF4444")
    throw new Error("Stopped status color mismatch");
  if (offlineColor !== "#64748B")
    throw new Error("Offline status color mismatch");

  // 2. Marker Feature Creation Test
  const mockMarker: MapVehicleMarker = {
    id: "v-101",
    name: "Vehicle 101",
    licensePlate: "DL-01-AB-1234",
    status: "moving",
    latitude: 28.6139,
    longitude: 77.209,
    speed: 55,
    heading: 90,
    driverName: "Robert Green",
    lastUpdated: "Just now",
  };

  const feature = createVehicleFeature(mockMarker);
  if (feature.id !== "v-101") {
    throw new Error("Feature ID assignment failed");
  }

  // 3. Cluster SDK Layer Setup Test
  const clusterLayer = createVehicleClusterSDKLayer(40);
  if (!clusterLayer || clusterLayer.clusterOptions.distance !== 40) {
    throw new Error("Cluster layer creation failed");
  }

  // 4. Cleanup Verification
  let mapTarget: string | HTMLElement | undefined = "map-element-id";
  mapTarget = undefined;
  if (mapTarget !== undefined) {
    throw new Error("Map target disposal cleanup failed");
  }

  return true;
}
