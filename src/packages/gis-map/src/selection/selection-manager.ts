/**
 * GIS Map SDK — Generic Selection Manager
 */

import { MapFeature, Coordinate } from "../types";
import { MapEventEmitter } from "../events/event-emitter";

export class SelectionManager {
  private selectedFeature: MapFeature | null = null;
  private hoveredFeature: MapFeature | null = null;
  private emitter: MapEventEmitter;

  constructor(emitter: MapEventEmitter) {
    this.emitter = emitter;
  }

  public selectFeature(
    feature: MapFeature | null,
    coordinate: Coordinate,
  ): void {
    if (
      this.selectedFeature &&
      (!feature || feature.id !== this.selectedFeature.id)
    ) {
      this.emitter.emit("featureDeselected", {
        featureId: this.selectedFeature.id,
      });
    }

    this.selectedFeature = feature;
    this.emitter.emit("featureSelected", { feature, coordinate });
  }

  public hoverFeature(
    feature: MapFeature | null,
    coordinate: Coordinate,
  ): void {
    if (this.hoveredFeature?.id !== feature?.id) {
      this.hoveredFeature = feature;
      this.emitter.emit("featureHovered", { feature, coordinate });
    }
  }

  public getSelectedFeature(): MapFeature | null {
    return this.selectedFeature;
  }

  public clearSelection(): void {
    if (this.selectedFeature) {
      const id = this.selectedFeature.id;
      this.selectedFeature = null;
      this.emitter.emit("featureDeselected", { featureId: id });
    }
  }
}
