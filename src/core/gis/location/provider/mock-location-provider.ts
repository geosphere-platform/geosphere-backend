/**
 * Framework-Independent Mock Location Provider
 *
 * Simulates GPS location updates for unit testing, integration tests, and headless environments.
 */

import {
  Location,
  LocationError,
  LocationSamplingOptions,
} from "../types/location.types";
import { ILocationProvider } from "./location-provider.interface";

export class MockLocationProvider implements ILocationProvider {
  public readonly name: string = "MockLocationProvider";
  public isAvailable: boolean = true;

  private mockLocation: Location = {
    latitude: 28.6139,
    longitude: 77.209,
    accuracy: 10,
    altitude: 216,
    speed: 0,
    heading: 0,
    timestamp: new Date().toISOString(),
    source: "mock-provider",
  };

  private timer: ReturnType<typeof setInterval> | null = null;
  private listener: ((loc: Location) => void) | null = null;

  public setMockLocation(location: Location): void {
    this.mockLocation = { ...location };
  }

  public triggerTick(): void {
    if (this.listener) {
      this.listener({ ...this.mockLocation, timestamp: new Date().toISOString() });
    }
  }

  public async getCurrentLocation(options?: LocationSamplingOptions): Promise<Location> {
    if (!this.isAvailable) {
      throw new LocationError("PROVIDER_UNAVAILABLE", "Mock Location Provider is currently unavailable.");
    }
    return { ...this.mockLocation, timestamp: new Date().toISOString() };
  }

  public startListening(
    onLocation: (location: Location) => void,
    onError?: (error: LocationError) => void,
    options?: LocationSamplingOptions
  ): void {
    if (!this.isAvailable) {
      if (onError) {
        onError(new LocationError("PROVIDER_UNAVAILABLE", "Mock Location Provider is currently unavailable."));
      }
      return;
    }

    this.listener = onLocation;
    const intervalMs = options?.updateIntervalMs ?? 1000;

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.listener) {
        this.listener({ ...this.mockLocation, timestamp: new Date().toISOString() });
      }
    }, intervalMs);
  }

  public stopListening(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.listener = null;
  }
}
