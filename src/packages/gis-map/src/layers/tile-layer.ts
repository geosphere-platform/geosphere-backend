/**
 * GIS Map SDK — Tile Layer Abstraction
 */

import { BaseGISLayer } from "./layer";
import { GISLayerConfig, BaseTileProvider } from "../types";

export class TileLayer extends BaseGISLayer {
  public provider: BaseTileProvider;

  constructor(
    config: Partial<GISLayerConfig> & { id: string; name: string },
    provider: BaseTileProvider = "osm",
  ) {
    super({
      id: config.id,
      name: config.name,
      type: "tile",
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1.0,
      zIndex: config.zIndex ?? 0,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      metadata: config.metadata,
    });
    this.provider = provider;
  }
}
