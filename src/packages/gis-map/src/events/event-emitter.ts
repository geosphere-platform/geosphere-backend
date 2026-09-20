/**
 * GIS Map SDK — Strongly Typed Event Emitter
 */

import { MapEventType, MapEventPayloadMap, MapEventListener } from "../types";

export class MapEventEmitter {
  private listeners: {
    [K in MapEventType]?: Set<MapEventListener<K>>;
  } = {};

  public on<K extends MapEventType>(
    event: K,
    listener: MapEventListener<K>,
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as any;
    }
    (this.listeners[event] as Set<MapEventListener<K>>).add(listener);

    // Return cleanup function to easily unsubscribe & avoid memory leaks
    return () => this.off(event, listener);
  }

  public off<K extends MapEventType>(
    event: K,
    listener: MapEventListener<K>,
  ): void {
    const set = this.listeners[event];
    if (set) {
      set.delete(listener);
    }
  }

  public emit<K extends MapEventType>(
    event: K,
    payload: MapEventPayloadMap[K],
  ): void {
    const set = this.listeners[event];
    if (set) {
      set.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          console.error(
            `[GIS Map SDK] Error in event listener for '${event}':`,
            err,
          );
        }
      });
    }
  }

  public removeAllListeners(): void {
    this.listeners = {};
  }
}
