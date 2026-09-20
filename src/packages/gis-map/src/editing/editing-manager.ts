/**
 * GIS Map SDK — Geometry Editing Manager
 */

import { Geometry } from "../types";
import { MapEventEmitter } from "../events/event-emitter";

export interface IEditingAdapter {
  startEditing(
    featureId: string,
    onUpdate: (geometry: Geometry) => void,
    onCancel: () => void,
  ): void;
  stopEditing(): void;
}

export class EditingManager {
  private adapter: IEditingAdapter;
  private emitter: MapEventEmitter;
  private editingFeatureId: string | null = null;

  constructor(adapter: IEditingAdapter, emitter: MapEventEmitter) {
    this.adapter = adapter;
    this.emitter = emitter;
  }

  public startEditing(featureId: string): void {
    this.editingFeatureId = featureId;
    this.emitter.emit("editStarted", { featureId });

    this.adapter.startEditing(
      featureId,
      (geometry: Geometry) => {
        const id = this.editingFeatureId ?? featureId;
        this.editingFeatureId = null;
        this.emitter.emit("editCompleted", { featureId: id, geometry });
      },
      () => {
        const id = this.editingFeatureId ?? featureId;
        this.editingFeatureId = null;
        this.emitter.emit("editCancelled", { featureId: id });
      },
    );
  }

  public stopEditing(): void {
    if (this.editingFeatureId) {
      const id = this.editingFeatureId;
      this.adapter.stopEditing();
      this.editingFeatureId = null;
      this.emitter.emit("editCancelled", { featureId: id });
    }
  }

  public isEditing(): boolean {
    return this.editingFeatureId !== null;
  }

  public getEditingFeatureId(): string | null {
    return this.editingFeatureId;
  }
}
