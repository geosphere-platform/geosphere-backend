/**
 * GIS Map SDK — Layer Manager
 *
 * Manages layer lifecycle, ordering, visibility, zoom ranges, and opacity.
 */

import { BaseGISLayer } from "./layer";
import { MapEventEmitter } from "../events/event-emitter";
import { StructuredMapError } from "../errors/map-errors";

export interface ILayerAdapter {
  addLayer(layer: BaseGISLayer): void;
  removeLayer(layerId: string): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  setLayerZIndex(layerId: string, zIndex: number): void;
}

export class LayerManager {
  private layers: Map<string, BaseGISLayer> = new Map();
  private adapter: ILayerAdapter;
  private emitter: MapEventEmitter;

  constructor(adapter: ILayerAdapter, emitter: MapEventEmitter) {
    this.adapter = adapter;
    this.emitter = emitter;
  }

  public registerLayer(layer: BaseGISLayer): void {
    this.addLayer(layer);
  }

  public unregisterLayer(layerId: string): void {
    this.removeLayer(layerId);
  }

  public addLayer(layer: BaseGISLayer): void {
    if (this.layers.has(layer.id)) {
      this.removeLayer(layer.id);
    }
    this.layers.set(layer.id, layer);
    this.adapter.addLayer(layer);
    this.emitter.emit("layerAdded", { layerId: layer.id, layer });
  }

  public removeLayer(layerId: string): void {
    if (this.layers.has(layerId)) {
      this.layers.delete(layerId);
      this.adapter.removeLayer(layerId);
      this.emitter.emit("layerRemoved", { layerId });
    }
  }

  public getLayer(layerId: string): BaseGISLayer | undefined {
    return this.layers.get(layerId);
  }

  public getLayers(): BaseGISLayer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  public showLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer)
      throw new StructuredMapError(
        "LAYER_NOT_FOUND",
        `Layer '${layerId}' not found`,
      );
    layer.visible = true;
    this.adapter.setLayerVisibility(layerId, true);
    this.emitter.emit("layerVisibilityChanged", { layerId, visible: true });
    this.emitter.emit("layerUpdated", { layerId, layer });
  }

  public hideLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer)
      throw new StructuredMapError(
        "LAYER_NOT_FOUND",
        `Layer '${layerId}' not found`,
      );
    layer.visible = false;
    this.adapter.setLayerVisibility(layerId, false);
    this.emitter.emit("layerVisibilityChanged", { layerId, visible: false });
    this.emitter.emit("layerUpdated", { layerId, layer });
  }

  public toggleLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      if (layer.visible) this.hideLayer(layerId);
      else this.showLayer(layerId);
    }
  }

  public setOpacity(layerId: string, opacity: number): void {
    const layer = this.layers.get(layerId);
    if (!layer)
      throw new StructuredMapError(
        "LAYER_NOT_FOUND",
        `Layer '${layerId}' not found`,
      );
    layer.opacity = Math.max(0, Math.min(1, opacity));
    this.adapter.setLayerOpacity(layerId, layer.opacity);
    this.emitter.emit("layerUpdated", { layerId, layer });
  }

  public setZIndex(layerId: string, zIndex: number): void {
    const layer = this.layers.get(layerId);
    if (!layer)
      throw new StructuredMapError(
        "LAYER_NOT_FOUND",
        `Layer '${layerId}' not found`,
      );
    layer.zIndex = zIndex;
    this.adapter.setLayerZIndex(layerId, zIndex);
    this.reorder();
    this.emitter.emit("layerUpdated", { layerId, layer });
  }

  public setZoomRange(
    layerId: string,
    minZoom?: number,
    maxZoom?: number,
  ): void {
    const layer = this.layers.get(layerId);
    if (!layer)
      throw new StructuredMapError(
        "LAYER_NOT_FOUND",
        `Layer '${layerId}' not found`,
      );
    layer.minZoom = minZoom;
    layer.maxZoom = maxZoom;
    this.emitter.emit("layerUpdated", { layerId, layer });
  }

  public reorderLayers(layerIds: string[]): void {
    layerIds.forEach((id, idx) => {
      const layer = this.layers.get(id);
      if (layer) {
        layer.zIndex = idx + 1;
        this.adapter.setLayerZIndex(id, layer.zIndex);
      }
    });
    this.reorder();
  }

  public reorder(): void {
    const sorted = this.getLayers();
    const layerIds = sorted.map((l) => l.id);
    this.emitter.emit("layerOrderChanged", { layerIds });
  }
}
