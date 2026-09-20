import { ClusterLayer, createPointClusterOptions } from "@gis/map";

export function createVehicleClusterSDKLayer(
  distance: number = 40,
): ClusterLayer {
  return new ClusterLayer(
    {
      id: "vehicle-cluster-layer",
      name: "Vehicle Cluster Layer",
      visible: true,
    },
    createPointClusterOptions({
      enabled: true,
      distance,
      minClusterSize: 2,
      clusterColor: "#2563EB",
    }),
  );
}

// Deprecated fallback stubs for backwards compatibility
export function createClusterSource(vectorSource: any, distance: number = 40) {
  return { distance, vectorSource };
}

export function createClusteredVectorLayer(clusterSource: any) {
  return createVehicleClusterSDKLayer(clusterSource?.distance || 40);
}
