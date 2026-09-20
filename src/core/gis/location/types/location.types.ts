/**
 * Framework-Independent Location Domain Models
 *
 * Defines core generic location primitives, location events, quality states, permission states,
 * error codes, and sampling configurations without depending on UI frameworks or vehicle-specific logic.
 */

export type LocationSource =
  | "mobile-gps"
  | "iot-sensor"
  | "network-triangulation"
  | "mock-provider"
  | "web-geolocation"
  | (string & {});

export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: string | number;
  source?: LocationSource;
  metadata?: Record<string, unknown>;
}

export type LocationQualityState =
  | "UNKNOWN"
  | "VALID"
  | "STALE"
  | "INVALID"
  | "LOW_ACCURACY";

export type LocationState =
  | "unavailable"
  | "acquiring"
  | "available"
  | "stale"
  | "error";

export type LocationPermissionState =
  | "UNKNOWN"
  | "DENIED"
  | "GRANTED"
  | "RESTRICTED"
  | "PERMANENTLY_DENIED";

export type LocationErrorCode =
  | "PERMISSION_DENIED"
  | "PROVIDER_UNAVAILABLE"
  | "TIMEOUT"
  | "INVALID_LOCATION"
  | "STALE_LOCATION"
  | "LOCATION_DISABLED"
  | "UNKNOWN_ERROR";

export class LocationError extends Error {
  public readonly code: LocationErrorCode;
  public readonly details?: unknown;

  constructor(code: LocationErrorCode, message: string, details?: unknown) {
    super(`[LocationError:${code}] ${message}`);
    this.name = "LocationError";
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, LocationError.prototype);
  }
}

export interface LocationEvent {
  id: string;
  entityId: string;
  entityType?: string;
  location: Location;
  qualityState: LocationQualityState;
  timestamp: string;
  timestampMs: number;
  metadata: Record<string, unknown>;
}

export interface LocationSamplingOptions {
  updateIntervalMs?: number;
  minDistanceMeters?: number;
  desiredAccuracyMeters?: number;
  maxAgeMs?: number;
  providerPreference?: "high-accuracy" | "balanced" | "battery-saver";
}

export interface LocationSubscription {
  id: string;
  unsubscribe: () => void;
}
