/**
 * Framework-Independent Core Location Engine
 *
 * Provides a generic, reusable engine for location acquisition, quality classification,
 * sampling configuration, and stream subscriptions. Operates purely on generic GeoSphere
 * Location domain objects without depending on UI frameworks, tracking logic, or geofencing logic.
 */

import {
  Location,
  LocationEvent,
  LocationError,
  LocationState,
  LocationQualityState,
  LocationSamplingOptions,
  LocationSubscription,
} from "../types/location.types";
import { LocationValidator } from "../validation/location-validator";
import { ILocationProvider } from "../provider/location-provider.interface";
import { MockLocationProvider } from "../provider/mock-location-provider";

export type LocationEventListener = (event: LocationEvent) => void;
export type LocationStateListener = (state: LocationState) => void;

export class LocationEngine {
  private provider: ILocationProvider;
  private samplingOptions: LocationSamplingOptions;
  private state: LocationState = "unavailable";
  private lastEvent: LocationEvent | null = null;

  private eventListeners: Set<LocationEventListener> = new Set();
  private stateListeners: Set<LocationStateListener> = new Set();

  private isRunning: boolean = false;
  private sequenceCounter: number = 0;

  constructor(
    provider?: ILocationProvider,
    options?: LocationSamplingOptions
  ) {
    this.provider = provider ?? new MockLocationProvider();
    this.samplingOptions = {
      updateIntervalMs: 5000,
      minDistanceMeters: 5,
      desiredAccuracyMeters: 50,
      maxAgeMs: 30000,
      providerPreference: "balanced",
      ...options,
    };

    if (this.provider.isAvailable) {
      this.setState("available");
    } else {
      this.setState("unavailable");
    }
  }

  public setProvider(provider: ILocationProvider): void {
    const wasRunning = this.isRunning;
    if (wasRunning) this.stop();

    this.provider = provider;
    this.setState(this.provider.isAvailable ? "available" : "unavailable");

    if (wasRunning && this.provider.isAvailable) {
      this.start();
    }
  }

  public setSamplingOptions(options: Partial<LocationSamplingOptions>): void {
    this.samplingOptions = { ...this.samplingOptions, ...options };
    if (this.isRunning) {
      // Restart listening with updated options
      this.start();
    }
  }

  public getSamplingOptions(): LocationSamplingOptions {
    return { ...this.samplingOptions };
  }

  public getState(): LocationState {
    return this.state;
  }

  public getLastLocationEvent(): LocationEvent | null {
    return this.lastEvent ? { ...this.lastEvent } : null;
  }

  public async getCurrentLocationEvent(entityId: string = "default-entity"): Promise<LocationEvent> {
    if (!this.provider.isAvailable) {
      this.setState("error");
      throw new LocationError("PROVIDER_UNAVAILABLE", "Active location provider is unavailable.");
    }

    try {
      this.setState("acquiring");
      const rawLocation = await this.provider.getCurrentLocation(this.samplingOptions);
      const event = this.createLocationEvent(entityId, rawLocation);
      this.lastEvent = event;
      this.setState("available");
      return event;
    } catch (err: any) {
      this.setState("error");
      if (err instanceof LocationError) throw err;
      throw new LocationError("UNKNOWN_ERROR", err?.message || "Failed to acquire location.", err);
    }
  }

  public start(entityId: string = "default-entity"): void {
    if (this.isRunning) return;

    if (!this.provider.isAvailable) {
      this.setState("unavailable");
      return;
    }

    this.isRunning = true;
    this.setState("acquiring");

    this.provider.startListening(
      (location) => {
        try {
          const event = this.createLocationEvent(entityId, location);
          this.lastEvent = event;
          this.setState("available");
          this.notifyEventListeners(event);
        } catch (err) {
          // Ignore invalid individual ticks, emit state error if critical
        }
      },
      (error) => {
        this.setState("error");
      },
      this.samplingOptions
    );
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.provider.stopListening();
    this.isRunning = false;
    if (this.state === "acquiring" || this.state === "available") {
      this.setState("available");
    }
  }

  public subscribe(listener: LocationEventListener): LocationSubscription {
    this.eventListeners.add(listener);
    const subId = `sub-${Math.random().toString(36).substring(2, 9)}`;
    return {
      id: subId,
      unsubscribe: () => {
        this.eventListeners.delete(listener);
      },
    };
  }

  public onStateChange(listener: LocationStateListener): LocationSubscription {
    this.stateListeners.add(listener);
    listener(this.state);
    const subId = `state-sub-${Math.random().toString(36).substring(2, 9)}`;
    return {
      id: subId,
      unsubscribe: () => {
        this.stateListeners.delete(listener);
      },
    };
  }

  public createLocationEvent(entityId: string, location: Location): LocationEvent {
    LocationValidator.validateLocation(location);

    const tsMs = LocationValidator.parseTimestampMs(location.timestamp);
    const isoTimestamp = new Date(tsMs).toISOString();
    const quality = LocationValidator.evaluateQuality(location, this.samplingOptions);

    this.sequenceCounter += 1;
    const eventId = `loc-evt-${tsMs}-${this.sequenceCounter}`;

    return {
      id: eventId,
      entityId,
      entityType: (location.metadata?.entityType as string) || "generic-asset",
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude ?? null,
        accuracy: location.accuracy ?? null,
        speed: location.speed ?? null,
        heading: LocationValidator.normalizeHeading(location.heading),
        timestamp: isoTimestamp,
        source: location.source || "mock-provider",
      },
      qualityState: quality,
      timestamp: isoTimestamp,
      timestampMs: tsMs,
      metadata: location.metadata ? { ...location.metadata } : {},
    };
  }

  private setState(newState: LocationState): void {
    if (this.state === newState) return;
    this.state = newState;
    for (const listener of this.stateListeners) {
      try {
        listener(this.state);
      } catch {
        // Suppress listener callback errors
      }
    }
  }

  private notifyEventListeners(event: LocationEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch {
        // Suppress listener callback errors
      }
    }
  }
}
