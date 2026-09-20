/**
 * GIS Core — Strongly Typed Event Bus
 *
 * Generic platform events for map lifecycle, feature selection, viewport movement, and layer visibility.
 */

import { Coordinate } from "../types/geometry";
import { SpatialEntity } from "../types/entity";
import { GISLayer } from "../types/layer";

export type GISEventType =
  | "mapReady"
  | "featureSelected"
  | "featureDeselected"
  | "featureCreated"
  | "featureUpdated"
  | "featureDeleted"
  | "viewportChanged"
  | "layerVisibilityChanged";

export interface GISEventMap {
  mapReady: { ready: boolean };
  featureSelected: { feature: SpatialEntity | null; coordinate: Coordinate };
  featureDeselected: { previousFeatureId?: string };
  featureCreated: { feature: SpatialEntity };
  featureUpdated: { feature: SpatialEntity };
  featureDeleted: { featureId: string };
  viewportChanged: { center: Coordinate; zoom: number };
  layerVisibilityChanged: { layer: GISLayer };
}

export type GISEventListener<K extends GISEventType> = (
  payload: GISEventMap[K],
) => void;

export class GISEventEmitter {
  private listeners: Partial<Record<GISEventType, unknown[]>> = {};

  public on<K extends GISEventType>(
    event: K,
    listener: GISEventListener<K>,
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener as unknown);
  }

  public off<K extends GISEventType>(
    event: K,
    listener: GISEventListener<K>,
  ): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event]!.filter(
      (l) => l !== (listener as unknown),
    );
  }

  public emit<K extends GISEventType>(event: K, payload: GISEventMap[K]): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach((listener) =>
        (listener as GISEventListener<K>)(payload),
      );
    }
  }
}
