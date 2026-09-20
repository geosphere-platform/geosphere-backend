/**
 * GIS Map SDK — Generic Drawing Manager
 */

import { DrawType, Geometry, MapFeature } from "../types";
import { MapEventEmitter } from "../events/event-emitter";
import { createMapFeature } from "../features/feature";

export interface IDrawingAdapter {
  startDrawing(
    type: DrawType,
    onComplete: (geometry: Geometry) => void,
    onCancel: () => void,
  ): void;
  stopDrawing(): void;
}

export class DrawingManager {
  private adapter: IDrawingAdapter;
  private emitter: MapEventEmitter;
  private activeType: DrawType | null = null;

  constructor(adapter: IDrawingAdapter, emitter: MapEventEmitter) {
    this.adapter = adapter;
    this.emitter = emitter;
  }

  public startDrawing(type: DrawType): void {
    this.activeType = type;
    this.emitter.emit("drawStarted", { type });

    this.adapter.startDrawing(
      type,
      (geometry: Geometry) => {
        const feature: MapFeature = createMapFeature(
          `draw-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          geometry,
        );
        this.activeType = null;
        this.emitter.emit("drawCompleted", { geometry, feature });
      },
      () => {
        this.activeType = null;
        this.emitter.emit("drawCancelled", undefined);
      },
    );
  }

  public stopDrawing(): void {
    if (this.activeType) {
      this.adapter.stopDrawing();
      this.activeType = null;
      this.emitter.emit("drawCancelled", undefined);
    }
  }

  public isDrawing(): boolean {
    return this.activeType !== null;
  }

  public getActiveType(): DrawType | null {
    return this.activeType;
  }
}
