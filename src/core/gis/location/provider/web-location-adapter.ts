/**
 * Framework-Independent Web Location Adapter
 *
 * Wraps browser navigator.geolocation behind the generic ILocationProvider contract.
 * Checks runtime environment safety so it does not throw in Node.js / server-side environments.
 */

import {
  Location,
  LocationError,
  LocationSamplingOptions,
} from "../types/location.types";
import { ILocationProvider } from "./location-provider.interface";

export class WebLocationAdapter implements ILocationProvider {
  public readonly name: string = "WebLocationAdapter";

  public get isAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      "geolocation" in navigator
    );
  }

  private watchId: number | null = null;

  public async getCurrentLocation(options?: LocationSamplingOptions): Promise<Location> {
    if (!this.isAvailable) {
      throw new LocationError("PROVIDER_UNAVAILABLE", "Web geolocation API is not available in current environment.");
    }

    return new Promise<Location>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: new Date(pos.timestamp).toISOString(),
            source: "web-geolocation",
          });
        },
        (err) => {
          reject(this.mapGeolocationError(err));
        },
        {
          enableHighAccuracy: options?.providerPreference === "high-accuracy",
          timeout: options?.maxAgeMs ?? 15000,
          maximumAge: options?.maxAgeMs ?? 30000,
        }
      );
    });
  }

  public startListening(
    onLocation: (location: Location) => void,
    onError?: (error: LocationError) => void,
    options?: LocationSamplingOptions
  ): void {
    if (!this.isAvailable) {
      if (onError) {
        onError(new LocationError("PROVIDER_UNAVAILABLE", "Web geolocation API is not available in current environment."));
      }
      return;
    }

    this.stopListening();

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: new Date(pos.timestamp).toISOString(),
          source: "web-geolocation",
        });
      },
      (err) => {
        if (onError) onError(this.mapGeolocationError(err));
      },
      {
        enableHighAccuracy: options?.providerPreference === "high-accuracy",
        timeout: options?.maxAgeMs ?? 15000,
        maximumAge: options?.maxAgeMs ?? 30000,
      }
    );
  }

  public stopListening(): void {
    if (this.watchId !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  private mapGeolocationError(err: { code: number; message: string }): LocationError {
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        return new LocationError("PERMISSION_DENIED", "User denied geolocation permission.", err);
      case 2: // POSITION_UNAVAILABLE
        return new LocationError("PROVIDER_UNAVAILABLE", "Location position unavailable.", err);
      case 3: // TIMEOUT
        return new LocationError("TIMEOUT", "Location acquisition request timed out.", err);
      default:
        return new LocationError("UNKNOWN_ERROR", err.message || "Unknown web geolocation error.", err);
    }
  }
}
