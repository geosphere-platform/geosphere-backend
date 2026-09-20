/**
 * GIS Map SDK — Feature Manager
 *
 * Manages generic vector features, indexing, and bulk operations.
 */

import { MapFeature } from "../types";
import { validateMapFeature } from "./feature";
import { MapEventEmitter } from "../events/event-emitter";
import { StructuredMapError } from "../errors/map-errors";

export class FeatureManager {
  private features: Map<string, MapFeature> = new Map();
  private emitter: MapEventEmitter;

  constructor(emitter: MapEventEmitter) {
    this.emitter = emitter;
  }

  public addFeature(feature: MapFeature): void {
    validateMapFeature(feature);
    this.features.set(feature.id, feature);
    this.emitter.emit("featureAdded", { feature });
  }

  public addFeatures(features: MapFeature[]): void {
    features.forEach((f) => validateMapFeature(f));
    features.forEach((f) => this.features.set(f.id, f));
    // Emit single bulk event or individual events depending on adapter implementation
    features.forEach((f) => this.emitter.emit("featureAdded", { feature: f }));
  }

  public updateFeature(feature: MapFeature): void {
    validateMapFeature(feature);
    if (!this.features.has(feature.id)) {
      throw new StructuredMapError(
        "FEATURE_NOT_FOUND",
        `Cannot update non-existent feature '${feature.id}'`,
      );
    }
    this.features.set(feature.id, feature);
    this.emitter.emit("featureUpdated", { feature });
  }

  public updateFeatures(features: MapFeature[]): void {
    features.forEach((f) => this.updateFeature(f));
  }

  public removeFeature(id: string): void {
    if (this.features.has(id)) {
      this.features.delete(id);
      this.emitter.emit("featureRemoved", { featureId: id });
    }
  }

  public removeFeatures(ids: string[]): void {
    ids.forEach((id) => this.removeFeature(id));
  }

  public getFeature(id: string): MapFeature | undefined {
    return this.features.get(id);
  }

  public getFeatures(): MapFeature[] {
    return Array.from(this.features.values());
  }

  public setFeatureState(id: string, state: MapFeature["state"]): void {
    const feat = this.features.get(id);
    if (feat) {
      feat.state = state;
      this.emitter.emit("featureUpdated", { feature: feat });
    }
  }

  public clearFeatures(): void {
    const ids = Array.from(this.features.keys());
    this.features.clear();
    ids.forEach((id) => this.emitter.emit("featureRemoved", { featureId: id }));
  }
}
