import { IMapProvider, LayerConfig } from "./map-provider.interface";
import { GeoJSONFeature } from "@gis-sdk/core";

export class LayerManager {
  private provider: IMapProvider;
  private layers: Map<string, LayerConfig> = new Map();

  constructor(provider: IMapProvider) {
    this.provider = provider;
  }

  public createLayer(config: LayerConfig): void {
    this.layers.set(config.id, config);
    this.provider.addLayer(config);
  }

  public removeLayer(layerId: string): void {
    this.layers.delete(layerId);
    this.provider.removeLayer(layerId);
  }

  public updateLayer(layerId: string, updates: Partial<LayerConfig>): void {
    const existing = this.layers.get(layerId);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.layers.set(layerId, updated);
      this.provider.updateLayer(layerId, updates);
    }
  }

  public setVisibility(layerId: string, visible: boolean): void {
    this.updateLayer(layerId, { visible });
  }

  public setOpacity(layerId: string, opacity: number): void {
    this.updateLayer(layerId, { opacity });
  }

  public setZIndex(layerId: string, zIndex: number): void {
    this.updateLayer(layerId, { zIndex });
  }

  public addFeature(layerId: string, feature: GeoJSONFeature): void {
    this.provider.addFeature(layerId, feature);
  }

  public removeFeature(layerId: string, featureId: string | number): void {
    this.provider.removeFeature(layerId, featureId);
  }

  public clearFeatures(layerId: string): void {
    this.provider.clearFeatures(layerId);
  }

  public getLayerConfig(layerId: string): LayerConfig | undefined {
    return this.layers.get(layerId);
  }

  public listLayers(): LayerConfig[] {
    return Array.from(this.layers.values());
  }
}
