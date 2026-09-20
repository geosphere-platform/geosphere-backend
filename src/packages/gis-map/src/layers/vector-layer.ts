/**
 * GIS Map SDK — Vector Layer Abstraction
 */

import { BaseGISLayer } from "./layer";
import { GISLayerConfig, MapFeature, FeatureStyle } from "../types";

export class VectorLayer extends BaseGISLayer {
  public defaultStyle?: FeatureStyle;

  constructor(
    config: Partial<GISLayerConfig> & { id: string; name: string },
    defaultStyle?: FeatureStyle,
  ) {
    super({
      id: config.id,
      name: config.name,
      type: "vector",
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1.0,
      zIndex: config.zIndex ?? 1,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      metadata: config.metadata,
    });
    this.defaultStyle = defaultStyle;
  }
}
