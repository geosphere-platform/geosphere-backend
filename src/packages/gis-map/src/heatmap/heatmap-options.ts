/**
 * GIS Map SDK — Generic Heatmap Options
 */

import { HeatmapLayerOptions } from "../types";

export const DEFAULT_HEATMAP_OPTIONS: Required<HeatmapLayerOptions> = {
  weightProperty: "weight",
  radius: 15,
  blur: 15,
  opacity: 0.8,
};

export function createHeatmapOptions(
  options?: Partial<HeatmapLayerOptions>,
): HeatmapLayerOptions {
  return {
    ...DEFAULT_HEATMAP_OPTIONS,
    ...options,
  };
}
