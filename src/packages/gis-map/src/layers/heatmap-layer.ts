/**
 * GIS Map SDK — Heatmap Layer Abstraction
 */

import { BaseGISLayer } from "./layer";
import { GISLayerConfig, HeatmapLayerOptions } from "../types";

export class HeatmapLayer extends BaseGISLayer {
  public heatmapOptions: HeatmapLayerOptions;

  constructor(
    config: Partial<GISLayerConfig> & { id: string; name: string },
    heatmapOptions: HeatmapLayerOptions = {},
  ) {
    super({
      id: config.id,
      name: config.name,
      type: "heatmap",
      visible: config.visible ?? true,
      opacity: config.opacity ?? 0.8,
      zIndex: config.zIndex ?? 3,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      metadata: config.metadata,
    });
    this.heatmapOptions = {
      radius: 15,
      blur: 15,
      ...heatmapOptions,
    };
  }
}
