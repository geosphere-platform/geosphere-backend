import { GeoJSONFeature, SDKEventEmitter } from "@gis-sdk/core";

export class SelectionManager {
  private selectedFeatures: Map<string | number, GeoJSONFeature> = new Map();
  private eventBus: SDKEventEmitter = new SDKEventEmitter();

  public selectFeature(feature: GeoJSONFeature): void {
    const id = feature.id ?? JSON.stringify(feature.geometry);
    this.selectedFeatures.set(id, feature);
    this.emitSelectionChange();
  }

  public unselectFeature(featureId: string | number): void {
    this.selectedFeatures.delete(featureId);
    this.emitSelectionChange();
  }

  public clearSelection(): void {
    this.selectedFeatures.clear();
    this.emitSelectionChange();
  }

  public getSelectedFeatures(): GeoJSONFeature[] {
    return Array.from(this.selectedFeatures.values());
  }

  public isSelected(featureId: string | number): boolean {
    return this.selectedFeatures.has(featureId);
  }

  private emitSelectionChange(): void {
    const selected = this.getSelectedFeatures();
    this.eventBus.emit("selectionChange", selected);
  }

  public onSelectionChange(
    cb: (selected: GeoJSONFeature[]) => void,
  ): () => void {
    return this.eventBus.on("selectionChange", cb);
  }
}
