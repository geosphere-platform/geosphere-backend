/**
 * Visualization Engine — Cluster Engine
 *
 * Configures point feature clustering distance, minimum cluster size,
 * feature count text, styling, and zoom activation limits.
 */

import { PointClusterOptions } from "../types";
import { ClusterConfig } from "./types";

export class ClusterEngine {
  /**
   * Evaluate whether clustering should be active at current zoom level.
   */
  public isClusterActiveAtZoom(
    config?: ClusterConfig,
    currentZoom?: number,
  ): boolean {
    if (!config || !config.enabled) return false;
    if (currentZoom === undefined) return config.enabled;

    if (config.minZoom !== undefined && currentZoom < config.minZoom)
      return false;
    if (config.maxZoom !== undefined && currentZoom > config.maxZoom)
      return false;

    return true;
  }

  /**
   * Resolve PointClusterOptions for GIS Map SDK layer.
   */
  public resolveClusterOptions(config?: ClusterConfig): PointClusterOptions {
    if (!config || !config.enabled) {
      return { enabled: false };
    }

    return {
      enabled: true,
      distance: config.radius ?? 40,
      minClusterSize: config.minClusterSize ?? 2,
      clusterColor: config.clusterColor || "#3b82f6",
      textColor: config.textColor || "#ffffff",
    };
  }
}
