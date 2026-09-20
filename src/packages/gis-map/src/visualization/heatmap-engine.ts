/**
 * Visualization Engine — Heatmap Engine
 *
 * Configures heatmap intensity, blur, radius, weight property parsing, and weight
 * normalization (safely handling null, negative, NaN, zero, and extreme values).
 */

import { HeatmapLayerOptions, MapFeature } from "../types";
import { HeatmapConfig } from "./types";

export class HeatmapEngine {
  /**
   * Resolve HeatmapLayerOptions for GIS Map SDK layer.
   */
  public resolveHeatmapOptions(config?: HeatmapConfig): HeatmapLayerOptions {
    if (!config || !config.enabled) {
      return { radius: 15, blur: 15, opacity: 0.8 };
    }

    return {
      radius: Math.max(1, config.radius ?? 15),
      blur: Math.max(0, config.blur ?? 15),
      opacity: Math.max(0, Math.min(1, config.opacity ?? 0.8)),
      weightProperty: config.weightField || "weight",
    };
  }

  /**
   * Safely calculate normalized feature weight [0.0, 1.0].
   */
  public calculateNormalizedWeight(
    feature: MapFeature,
    config?: HeatmapConfig,
  ): number {
    if (!config || !config.weightField) return 0.5;

    const props = feature.properties || {};
    const rawVal = props[config.weightField];

    if (rawVal === undefined || rawVal === null) return 0.1;

    const num = Number(rawVal);
    if (isNaN(num)) return 0.1;

    // Handle non-positive or negative numbers
    if (num <= 0) return 0.05;

    const min = config.weightMin ?? 0;
    const max = config.weightMax ?? 100;

    if (max <= min) return 0.5;

    const normalized = (num - min) / (max - min);
    return Math.max(0.01, Math.min(1.0, normalized));
  }
}
