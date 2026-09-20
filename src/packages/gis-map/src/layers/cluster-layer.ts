/**
 * GIS Map SDK — Cluster Layer Abstraction
 */

import { BaseGISLayer } from "./layer";
import { GISLayerConfig, PointClusterOptions } from "../types";

export class ClusterLayer extends BaseGISLayer {
  public clusterOptions: PointClusterOptions;

  constructor(
    config: Partial<GISLayerConfig> & { id: string; name: string },
    clusterOptions: PointClusterOptions,
  ) {
    super({
      id: config.id,
      name: config.name,
      type: "cluster",
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1.0,
      zIndex: config.zIndex ?? 2,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      metadata: config.metadata,
    });
    this.clusterOptions = clusterOptions;
  }
}
