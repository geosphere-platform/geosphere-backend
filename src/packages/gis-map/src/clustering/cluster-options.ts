/**
 * GIS Map SDK — Generic Point Clustering Options
 */

import { PointClusterOptions } from "../types";

export const DEFAULT_CLUSTER_OPTIONS: Required<PointClusterOptions> = {
  enabled: true,
  distance: 40,
  minClusterSize: 2,
  clusterColor: "#2563eb",
  textColor: "#ffffff",
};

export function createPointClusterOptions(
  options?: Partial<PointClusterOptions>,
): PointClusterOptions {
  return {
    ...DEFAULT_CLUSTER_OPTIONS,
    ...options,
  };
}
