/**
 * GeoSphere Location SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral & Privacy Decoupled (Acquisition ONLY — Zero Automatic Telemetry Upload)
 */

export type LocationAccuracyQuality = "UNKNOWN" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type GeoSphereLocationState =
  | "INITIALIZING"
  | "READY"
  | "PERMISSION_REQUIRED"
  | "PERMISSION_DENIED"
  | "SERVICE_DISABLED"
  | "ACQUIRING"
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "ERROR"
  | "STOPPED";

export type GeoSphereLocationPermission =
  | "UNKNOWN"
  | "GRANTED"
  | "DENIED"
  | "NOT_REQUESTED"
  | "RESTRICTED"
  | "PERMANENTLY_DENIED";

export type GeoSphereLocationServiceState = "UNKNOWN" | "ENABLED" | "DISABLED" | "RESTRICTED";

export type GeoSphereLocationCapability =
  | "CURRENT_LOCATION"
  | "CONTINUOUS_UPDATES"
  | "HIGH_ACCURACY"
  | "HEADING"
  | "SPEED"
  | "ALTITUDE"
  | "BACKGROUND_LOCATION"
  | "MOCK_LOCATION_DETECTION";

export interface GeoSphereLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: string; // ISO 8601 UTC
  source?: string;
  isMocked?: boolean;
  metadata?: Record<string, unknown>;
}

export interface GeoSphereLocationConfig {
  desiredAccuracy?: number; // Desired accuracy in meters
  timeout?: number; // Request timeout in ms
  maximumAge?: number; // Acceptable cached location age in ms
  updateInterval?: number; // Continuous stream interval in ms
  minimumDistance?: number; // Minimum distance filter in meters
  stalePolicyMaxAge?: number; // Stale location threshold in ms
  providerPreference?: "high-accuracy" | "balanced" | "battery-saver";
  embeddedMode?: boolean;
}

export interface GeoSphereLocationSubscription {
  id: string;
  unsubscribe: () => void;
}

export interface ILocationAdapterContract {
  initialize(): Promise<void>;
  destroy(): void;
  getCurrentLocation(config: GeoSphereLocationConfig): Promise<GeoSphereLocation>;
  startUpdates(config: GeoSphereLocationConfig, onUpdate: (location: GeoSphereLocation) => void, onError?: (err: Error) => void): void;
  stopUpdates(): void;
  getCapabilities(): GeoSphereLocationCapability[];
  getPermissionState(): Promise<GeoSphereLocationPermission>;
  getServiceState(): Promise<GeoSphereLocationServiceState>;
}

export function validateGeoSphereLocation(location: unknown): GeoSphereLocation {
  if (!location || typeof location !== "object") {
    throw new Error("[LOCATION_ERROR:INVALID_LOCATION] Location data must be a valid object.");
  }
  const loc = location as Partial<GeoSphereLocation>;
  if (typeof loc.latitude !== "number" || isNaN(loc.latitude) || loc.latitude < -90 || loc.latitude > 90) {
    throw new Error("[LOCATION_ERROR:INVALID_LOCATION] Invalid latitude. Must be between -90 and 90.");
  }
  if (typeof loc.longitude !== "number" || isNaN(loc.longitude) || loc.longitude < -180 || loc.longitude > 180) {
    throw new Error("[LOCATION_ERROR:INVALID_LOCATION] Invalid longitude. Must be between -180 and 180.");
  }
  return {
    latitude: loc.latitude,
    longitude: loc.longitude,
    accuracy: loc.accuracy ?? null,
    altitude: loc.altitude ?? null,
    altitudeAccuracy: loc.altitudeAccuracy ?? null,
    heading: loc.heading ?? null,
    speed: loc.speed ?? null,
    timestamp: loc.timestamp || new Date().toISOString(),
    source: loc.source || "client-gps",
    isMocked: loc.isMocked ?? false,
    metadata: loc.metadata || {}
  };
}

export function classifyLocationAccuracy(accuracyMeters?: number | null): LocationAccuracyQuality {
  if (accuracyMeters === undefined || accuracyMeters === null || isNaN(accuracyMeters)) return "UNKNOWN";
  if (accuracyMeters <= 5) return "VERY_HIGH";
  if (accuracyMeters <= 15) return "HIGH";
  if (accuracyMeters <= 50) return "MEDIUM";
  return "LOW";
}

export function isLocationStale(location: GeoSphereLocation, maxAgeMs: number = 60000): boolean {
  const locTime = new Date(location.timestamp).getTime();
  if (isNaN(locTime)) return true;
  return Date.now() - locTime > maxAgeMs;
}

export class GeoSphereLocationSDK {
  private currentState: GeoSphereLocationState = "INITIALIZING";
  private permissionState: GeoSphereLocationPermission = "NOT_REQUESTED";
  private serviceState: GeoSphereLocationServiceState = "ENABLED";
  private currentLocation: GeoSphereLocation | null = null;
  private adapter?: ILocationAdapterContract;
  private listeners: Map<string, (location: GeoSphereLocation) => void> = new Map();
  private updateActive: boolean = false;

  constructor(private config: GeoSphereLocationConfig = {}) {}

  public async initialize(adapter?: ILocationAdapterContract): Promise<void> {
    this.currentState = "INITIALIZING";
    if (adapter) {
      this.adapter = adapter;
      await this.adapter.initialize();
      this.permissionState = await this.adapter.getPermissionState();
      this.serviceState = await this.adapter.getServiceState();
    } else {
      this.permissionState = "GRANTED";
      this.serviceState = "ENABLED";
    }

    if (this.serviceState === "DISABLED") {
      this.currentState = "SERVICE_DISABLED";
    } else if (this.permissionState === "DENIED" || this.permissionState === "PERMANENTLY_DENIED") {
      this.currentState = "PERMISSION_DENIED";
    } else {
      this.currentState = "READY";
    }
  }

  public getState(): GeoSphereLocationState {
    return this.currentState;
  }

  public getPermissionState(): GeoSphereLocationPermission {
    return this.permissionState;
  }

  public getServiceState(): GeoSphereLocationServiceState {
    return this.serviceState;
  }

  public getCapabilities(): GeoSphereLocationCapability[] {
    if (this.adapter) {
      return this.adapter.getCapabilities();
    }
    return ["CURRENT_LOCATION", "CONTINUOUS_UPDATES", "HIGH_ACCURACY", "HEADING", "SPEED", "ALTITUDE"];
  }

  public hasCapability(capability: GeoSphereLocationCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async getCurrentLocation(options?: Partial<GeoSphereLocationConfig>): Promise<GeoSphereLocation> {
    if (this.currentState === "SERVICE_DISABLED") {
      throw new Error("[LOCATION_ERROR:LOCATION_DISABLED] Device location service is disabled.");
    }
    if (this.currentState === "PERMISSION_DENIED") {
      throw new Error("[LOCATION_ERROR:PERMISSION_DENIED] Location permission was denied.");
    }

    this.currentState = "ACQUIRING";
    const effectiveConfig = { ...this.config, ...options };

    if (this.adapter) {
      const raw = await this.adapter.getCurrentLocation(effectiveConfig);
      this.currentLocation = validateGeoSphereLocation(raw);
    } else {
      // Mock/Contract location acquisition
      this.currentLocation = validateGeoSphereLocation({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
        altitude: 15,
        heading: 180,
        speed: 5.5,
        timestamp: new Date().toISOString(),
        source: "simulated-gps"
      });
    }

    this.currentState = "AVAILABLE";
    return this.currentLocation;
  }

  public startUpdates(options?: Partial<GeoSphereLocationConfig>): void {
    if (this.updateActive) return;
    this.updateActive = true;
    this.currentState = "ACQUIRING";

    const effectiveConfig = { ...this.config, ...options };

    if (this.adapter) {
      this.adapter.startUpdates(
        effectiveConfig,
        (location) => {
          const validated = validateGeoSphereLocation(location);
          this.currentLocation = validated;
          this.currentState = "AVAILABLE";
          this.notifyListeners(validated);
        },
        (err) => {
          this.currentState = "ERROR";
        }
      );
    } else {
      // Simulated continuous stream
      const validated = validateGeoSphereLocation({
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 8,
        timestamp: new Date().toISOString(),
        source: "simulated-gps"
      });
      this.currentLocation = validated;
      this.currentState = "AVAILABLE";
      this.notifyListeners(validated);
    }
  }

  public stopUpdates(): void {
    this.updateActive = false;
    if (this.adapter) {
      this.adapter.stopUpdates();
    }
    this.currentState = "STOPPED";
  }

  public subscribe(onLocationUpdate: (location: GeoSphereLocation) => void): GeoSphereLocationSubscription {
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onLocationUpdate);

    if (this.currentLocation) {
      onLocationUpdate(this.currentLocation);
    }

    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public getLastKnownLocation(): GeoSphereLocation | null {
    return this.currentLocation;
  }

  public destroy(): void {
    this.stopUpdates();
    this.listeners.clear();
    if (this.adapter) {
      this.adapter.destroy();
    }
    this.currentLocation = null;
    this.currentState = "STOPPED";
  }

  private notifyListeners(location: GeoSphereLocation): void {
    this.listeners.forEach((listener) => {
      try {
        listener(location);
      } catch (err) {
        console.error("[LOCATION_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
