/**
 * GeoSphere Framework-Neutral Event Contracts & Event Bus
 */

export type EventCategory = "LIFECYCLE" | "SDK" | "UI" | "CONFIGURATION" | "DOMAIN";

export interface GeoSphereEvent<T = unknown> {
  eventId: string;
  type: string;
  category: EventCategory;
  timestamp: string;
  source: string;
  payload: T;
  correlationId?: string;
  tenantId?: string;
}

export type GeoSphereEventHandler<T = unknown> = (event: GeoSphereEvent<T>) => void | Promise<void>;

export class GeoSphereEventBus {
  private listeners: Map<string, Set<GeoSphereEventHandler<any>>> = new Map();

  public on<T = unknown>(eventType: string, handler: GeoSphereEventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler as GeoSphereEventHandler<any>);

    return () => this.off(eventType, handler);
  }

  public off<T = unknown>(eventType: string, handler: GeoSphereEventHandler<T>): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler as GeoSphereEventHandler<any>);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  public emit<T = unknown>(event: GeoSphereEvent<T>): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EVENT_BUS_ERROR] Error executing handler for event '${event.type}':`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }

  public listenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}
