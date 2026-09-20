/**
 * GeoSphere Tracking SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Tracking Session & Telemetry Management
 * Consumes GeoSphere Location SDK from Step 10 (Zero Duplicate Location Acquisition)
 */

import {
  GeoSphereLocation,
  GeoSphereLocationConfig,
  GeoSphereLocationSDK
} from "./location.contracts.js";

export type GeoSphereTrackingState =
  | "IDLE"
  | "STARTING"
  | "RUNNING"
  | "PAUSED"
  | "STOPPING"
  | "STOPPED"
  | "ERROR";

export type GeoSphereTrackingQuality = "UNKNOWN" | "POOR" | "FAIR" | "GOOD" | "EXCELLENT";

export type GeoSphereTrackingCapability =
  | "CURRENT_LOCATION"
  | "CONTINUOUS_LOCATION"
  | "PAUSE_RESUME"
  | "DISTANCE_CALCULATION"
  | "TELEMETRY";

export interface GeoSphereTrackingPoint {
  sequence: number;
  location: GeoSphereLocation;
  distanceFromPreviousMeters: number;
  timeFromPreviousMs: number;
  speedCalculated?: number | null; // m/s
  metadata?: Record<string, unknown>;
}

export interface GeoSphereTrackingStatistics {
  totalDistanceMeters: number;
  totalDistanceKm: number;
  activeDurationMs: number;
  pausedDurationMs: number;
  pointCount: number;
  avgAccuracyMeters: number | null;
  latestSpeedKmh: number | null;
  firstPointTime?: string | null;
  latestPointTime?: string | null;
}

export interface GeoSphereTrackingSession {
  sessionId: string;
  entityId: string;
  entityType: string;
  state: GeoSphereTrackingState;
  startTime: string; // ISO 8601 UTC
  endTime?: string | null;
  activeDurationMs: number;
  pausedDurationMs: number;
  pointCount: number;
  distanceMeters: number;
  quality: GeoSphereTrackingQuality;
  metadata: Record<string, unknown>;
}

export interface GeoSphereTrackingConfig {
  locationConfig?: GeoSphereLocationConfig;
  updateIntervalMs?: number;
  minDistanceMeters?: number;
  maxAccuracyThresholdMeters?: number;
  stalePolicyMaxAgeMs?: number;
  speedCalculationMode?: "provider-first" | "calculate-from-distance";
  embeddedMode?: boolean;
}

export interface ITelemetryProviderContract {
  sendTrackingPoint(point: GeoSphereTrackingPoint, session: GeoSphereTrackingSession): Promise<void>;
  sendTrackingSession(session: GeoSphereTrackingSession): Promise<void>;
}

export class GeoSphereDistanceCalculator {
  /**
   * Computes Haversine great-circle distance between two geographic coordinates in meters.
   */
  public static haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }
}

export function classifyTrackingQuality(points: GeoSphereTrackingPoint[]): GeoSphereTrackingQuality {
  if (!points || points.length === 0) return "UNKNOWN";
  const validAccuracies = points
    .map((p) => p.location.accuracy)
    .filter((acc): acc is number => typeof acc === "number" && !isNaN(acc));

  if (validAccuracies.length === 0) return "FAIR";
  const avgAcc = validAccuracies.reduce((a, b) => a + b, 0) / validAccuracies.length;

  if (avgAcc <= 8) return "EXCELLENT";
  if (avgAcc <= 20) return "GOOD";
  if (avgAcc <= 50) return "FAIR";
  return "POOR";
}

export class GeoSphereTrackingSDK {
  private locationSdk: GeoSphereLocationSDK;
  private session: GeoSphereTrackingSession | null = null;
  private points: GeoSphereTrackingPoint[] = [];
  private telemetryProvider?: ITelemetryProviderContract;
  private pauseStartTime: number | null = null;
  private listeners: Map<string, (session: GeoSphereTrackingSession, latestPoint?: GeoSphereTrackingPoint) => void> = new Map();
  private locationSubId: string | null = null;

  constructor(
    private config: GeoSphereTrackingConfig = {},
    locationSdk?: GeoSphereLocationSDK
  ) {
    // Consumes Location SDK from Step 10 (Zero Duplicate Location Acquisition)
    this.locationSdk = locationSdk || new GeoSphereLocationSDK(config.locationConfig);
  }

  public async initialize(telemetryProvider?: ITelemetryProviderContract): Promise<void> {
    if (telemetryProvider) {
      this.telemetryProvider = telemetryProvider;
    }
    await this.locationSdk.initialize();
  }

  public getLocationSDK(): GeoSphereLocationSDK {
    return this.locationSdk;
  }

  public getState(): GeoSphereTrackingState {
    return this.session ? this.session.state : "IDLE";
  }

  public getSession(): GeoSphereTrackingSession | null {
    return this.session;
  }

  public getPoints(): GeoSphereTrackingPoint[] {
    return [...this.points];
  }

  public getCapabilities(): GeoSphereTrackingCapability[] {
    return ["CURRENT_LOCATION", "CONTINUOUS_LOCATION", "PAUSE_RESUME", "DISTANCE_CALCULATION", "TELEMETRY"];
  }

  public hasCapability(capability: GeoSphereTrackingCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async start(entityId: string, entityType: string = "asset", metadata: Record<string, unknown> = {}): Promise<GeoSphereTrackingSession> {
    if (this.session && (this.session.state === "RUNNING" || this.session.state === "PAUSED")) {
      throw new Error(`[TRACKING_ERROR:INVALID_STATE] Cannot start session. Active session already exists in state ${this.session.state}.`);
    }

    const sessionId = `trk_sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const nowIso = new Date().toISOString();

    this.session = {
      sessionId,
      entityId,
      entityType,
      state: "STARTING",
      startTime: nowIso,
      endTime: null,
      activeDurationMs: 0,
      pausedDurationMs: 0,
      pointCount: 0,
      distanceMeters: 0,
      quality: "UNKNOWN",
      metadata
    };

    this.points = [];
    this.session.state = "RUNNING";

    // Subscribe to Location SDK stream
    const sub = this.locationSdk.subscribe((location) => {
      this.handleLocationUpdate(location);
    });
    this.locationSubId = sub.id;
    this.locationSdk.startUpdates(this.config.locationConfig);

    this.notifyListeners();
    return this.session;
  }

  public pause(): void {
    if (!this.session || this.session.state !== "RUNNING") {
      throw new Error(`[TRACKING_ERROR:INVALID_STATE] Cannot pause session unless state is RUNNING.`);
    }
    this.session.state = "PAUSED";
    this.pauseStartTime = Date.now();
    this.notifyListeners();
  }

  public resume(): void {
    if (!this.session || this.session.state !== "PAUSED") {
      throw new Error(`[TRACKING_ERROR:INVALID_STATE] Cannot resume session unless state is PAUSED.`);
    }
    if (this.pauseStartTime) {
      this.session.pausedDurationMs += Date.now() - this.pauseStartTime;
      this.pauseStartTime = null;
    }
    this.session.state = "RUNNING";
    this.notifyListeners();
  }

  public stop(): GeoSphereTrackingSession {
    if (!this.session || this.session.state === "STOPPED" || this.session.state === "IDLE") {
      if (this.session) return this.session;
      throw new Error(`[TRACKING_ERROR:INVALID_STATE] No active tracking session to stop.`);
    }

    if (this.session.state === "PAUSED" && this.pauseStartTime) {
      this.session.pausedDurationMs += Date.now() - this.pauseStartTime;
      this.pauseStartTime = null;
    }

    this.session.state = "STOPPING";
    this.locationSdk.stopUpdates();
    this.session.endTime = new Date().toISOString();
    this.session.state = "STOPPED";
    this.session.quality = classifyTrackingQuality(this.points);

    if (this.telemetryProvider && this.session) {
      this.telemetryProvider.sendTrackingSession(this.session).catch(() => {});
    }

    this.notifyListeners();
    return this.session;
  }

  public getStatistics(): GeoSphereTrackingStatistics {
    const totalDist = this.session ? this.session.distanceMeters : 0;
    const activeDur = this.session ? this.calculateActiveDuration() : 0;
    const pausedDur = this.session ? this.session.pausedDurationMs : 0;

    const validAccuracies = this.points
      .map((p) => p.location.accuracy)
      .filter((a): a is number => typeof a === "number" && !isNaN(a));
    const avgAcc = validAccuracies.length > 0 ? validAccuracies.reduce((a, b) => a + b, 0) / validAccuracies.length : null;

    const lastPoint = this.points.length > 0 ? this.points[this.points.length - 1] : null;
    const firstPoint = this.points.length > 0 ? this.points[0] : null;
    const latestSpeedMetersSec = lastPoint?.location.speed ?? lastPoint?.speedCalculated ?? null;
    const latestSpeedKmh = latestSpeedMetersSec !== null ? Math.round(latestSpeedMetersSec * 3.6 * 10) / 10 : null;

    return {
      totalDistanceMeters: totalDist,
      totalDistanceKm: Math.round((totalDist / 1000) * 100) / 100,
      activeDurationMs: activeDur,
      pausedDurationMs: pausedDur,
      pointCount: this.points.length,
      avgAccuracyMeters: avgAcc ? Math.round(avgAcc * 10) / 10 : null,
      latestSpeedKmh,
      firstPointTime: firstPoint?.location.timestamp ?? null,
      latestPointTime: lastPoint?.location.timestamp ?? null
    };
  }

  public subscribe(onTrackingUpdate: (session: GeoSphereTrackingSession, latestPoint?: GeoSphereTrackingPoint) => void): { id: string; unsubscribe: () => void } {
    const subId = `trk_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onTrackingUpdate);

    if (this.session) {
      onTrackingUpdate(this.session, this.points[this.points.length - 1]);
    }

    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    if (this.session && this.session.state !== "STOPPED") {
      this.stop();
    }
    this.listeners.clear();
    this.points = [];
    this.session = null;
    this.locationSdk.destroy();
  }

  private handleLocationUpdate(location: GeoSphereLocation): void {
    if (!this.session || this.session.state !== "RUNNING") return;

    // Accuracy Threshold Filter
    if (this.config.maxAccuracyThresholdMeters && location.accuracy && location.accuracy > this.config.maxAccuracyThresholdMeters) {
      return;
    }

    const prevPoint = this.points.length > 0 ? this.points[this.points.length - 1] : null;
    let distDeltaMeters = 0;
    let timeDeltaMs = 0;
    let speedCalc: number | null = null;

    if (prevPoint) {
      distDeltaMeters = GeoSphereDistanceCalculator.haversineMeters(
        prevPoint.location.latitude,
        prevPoint.location.longitude,
        location.latitude,
        location.longitude
      );

      // Minimum Distance Filter
      if (this.config.minDistanceMeters && distDeltaMeters < this.config.minDistanceMeters) {
        return;
      }

      timeDeltaMs = new Date(location.timestamp).getTime() - new Date(prevPoint.location.timestamp).getTime();
      if (timeDeltaMs > 0) {
        speedCalc = Math.round((distDeltaMeters / (timeDeltaMs / 1000)) * 100) / 100;
      }
    }

    const newPoint: GeoSphereTrackingPoint = {
      sequence: this.points.length + 1,
      location,
      distanceFromPreviousMeters: distDeltaMeters,
      timeFromPreviousMs: timeDeltaMs,
      speedCalculated: speedCalc
    };

    this.points.push(newPoint);
    this.session.pointCount = this.points.length;
    this.session.distanceMeters += distDeltaMeters;
    this.session.activeDurationMs = this.calculateActiveDuration();
    this.session.quality = classifyTrackingQuality(this.points);

    if (this.telemetryProvider) {
      this.telemetryProvider.sendTrackingPoint(newPoint, this.session).catch(() => {});
    }

    this.notifyListeners(newPoint);
  }

  private calculateActiveDuration(): number {
    if (!this.session) return 0;
    const start = new Date(this.session.startTime).getTime();
    const now = this.session.endTime ? new Date(this.session.endTime).getTime() : Date.now();
    return Math.max(0, now - start - this.session.pausedDurationMs);
  }

  private notifyListeners(latestPoint?: GeoSphereTrackingPoint): void {
    if (!this.session) return;
    this.listeners.forEach((listener) => {
      try {
        listener(this.session!, latestPoint);
      } catch (err) {
        console.error("[TRACKING_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
