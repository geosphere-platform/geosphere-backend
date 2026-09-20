/**
 * GIS Map SDK — Layer Interface & Models
 */

import { GISLayerConfig, LayerType } from "../types";

export abstract class BaseGISLayer implements GISLayerConfig {
  public id: string;
  public name: string;
  public type: LayerType;
  public visible: boolean;
  public opacity: number;
  public zIndex: number;
  public minZoom?: number;
  public maxZoom?: number;
  public metadata?: Record<string, unknown>;

  constructor(config: GISLayerConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.visible = config.visible ?? true;
    this.opacity = config.opacity ?? 1.0;
    this.zIndex = config.zIndex ?? 1;
    this.minZoom = config.minZoom;
    this.maxZoom = config.maxZoom;
    this.metadata = config.metadata ?? {};
  }
}
