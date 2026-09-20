/**
 * Framework-Independent Generic Tracking Engine Domain Models
 *
 * Defines track points, track segments, aggregated tracks, session states, track statistics,
 * and tracking configuration options for generic trackable entities (vehicles, devices, assets,
 * personnel, equipment, IoT sensors) without vehicle-specific or UI framework dependencies.
 */

import { LocationEvent } from "../../location/types/location.types";
import { LineStringGeometry, MultiLineStringGeometry, Coordinate } from "../../types/geometry";

export interface TrackPoint {
  sequence: number;
  locationEvent: LocationEvent;
  coordinate: Coordinate; // [longitude, latitude]
  timestamp: string; // ISO 8601 UTC
  timestampMs: number;
  accuracy: number | null;
  altitude: number | null;
  speedProvider: number | null; // m/s from provider
  speedCalculated: number | null; // m/s computed from distance / time delta
  heading: number | null; // 0 - 360 deg
  distanceFromPreviousMeters: number;
  timeFromPreviousMs: number;
  metadata: Record<string, unknown>;
}

export interface TrackSegment {
  segmentIndex: number;
  startTime: string;
  endTime: string;
  durationMs: number;
  distanceMeters: number;
  pointCount: number;
  points: TrackPoint[];
  geometry: LineStringGeometry | null;
}

export interface TrackSpeedStatistics {
  minSpeedMs: number | null;
  maxSpeedMs: number | null;
  avgSpeedMs: number | null;
  minSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  avgSpeedKmh: number | null;
  speedSource: "provider" | "calculated" | "mixed" | "none";
}

export interface TrackStatistics {
  totalDistanceMeters: number;
  totalDistanceKm: number;
  totalDurationMs: number;
  totalDurationSeconds: number;
  pointCount: number;
  segmentCount: number;
  speedStats: TrackSpeedStatistics;
  firstObservationAt: string | null;
  lastObservationAt: string | null;
  hasGaps: boolean;
  dataQualityNotes: string[];
}

export type TrackingSessionState =
  | "IDLE"
  | "STARTING"
  | "ACTIVE"
  | "PAUSED"
  | "STOPPING"
  | "COMPLETED"
  | "CANCELLED"
  | "ERROR";

export interface TrackingSession {
  sessionId: string;
  entityId: string;
  entityType: string;
  state: TrackingSessionState;
  startTime: string;
  endTime?: string | null;
  metadata: Record<string, unknown>;
}

export type DeduplicationStrategy =
  | "none"
  | "filter-identical-coordinates"
  | "filter-stale-timestamps";

export interface TrackingOptions {
  minDistanceThresholdMeters?: number; // Minimum movement distance to append point
  maxGapDurationSeconds?: number; // Threshold to split track into new segment (default 300s)
  maxAccuracyThresholdMeters?: number; // Filter points with poor accuracy
  deduplicationStrategy?: DeduplicationStrategy;
  speedCalculationMode?: "provider-first" | "calculate-from-distance" | "provider-only";
}

export interface Track {
  id: string;
  entityId: string;
  entityType: string;
  startTime: string;
  endTime: string;
  points: TrackPoint[];
  segments: TrackSegment[];
  geometry: LineStringGeometry | MultiLineStringGeometry | null;
  statistics: TrackStatistics;
  status: "active" | "completed" | "archived";
  metadata: Record<string, unknown>;
}
