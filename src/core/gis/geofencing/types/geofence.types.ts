/**
 * GeoSphere Core Geofencing Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for Circle and Polygon geofences, spatial evaluation states,
 * state transition events (ENTER, EXIT, DWELL_START, DWELL_END), dwell configuration,
 * and geofence options.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { Coordinate, PolygonGeometry, MultiPolygonGeometry } from "../../types/geometry";
import { LocationEvent } from "../../location/types/location.types";

export type GeofenceType = "circle" | "polygon" | "multipolygon";

export interface CircleGeofenceGeometry {
  type: "circle";
  center: Coordinate; // [longitude, latitude]
  radiusMeters: number;
}

export interface PolygonGeofenceGeometry {
  type: "polygon";
  geometry: PolygonGeometry | MultiPolygonGeometry;
}

export type GeofenceGeometry = CircleGeofenceGeometry | PolygonGeofenceGeometry;

export type GeofenceState = "INSIDE" | "OUTSIDE" | "BOUNDARY" | "UNKNOWN";

export type GeofenceEventType = "ENTER" | "EXIT" | "DWELL_START" | "DWELL_END" | "NO_CHANGE";

export interface DwellConfig {
  enabled: boolean;
  dwellDurationSeconds: number; // Minimum continuous dwell time to trigger DWELL_START
}

export interface GeofenceOptions {
  accuracyThresholdMeters?: number; // Exclude low-accuracy location updates
  boundaryToleranceMeters?: number; // Tolerance distance for boundary determination
  dwellConfig?: DwellConfig;
}

export interface Geofence {
  id: string;
  name: string;
  geometry: GeofenceGeometry;
  enabled: boolean;
  options?: GeofenceOptions;
  metadata?: Record<string, unknown>;
}

export interface GeofenceEvaluationResult {
  geofenceId: string;
  geofenceName: string;
  subjectId: string; // Generic trackable entity ID (vehicle, personnel, asset, device)
  state: GeofenceState;
  distanceToBoundaryMeters?: number;
  evaluatedAt: string; // ISO 8601 UTC
}

export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  geofenceName: string;
  subjectId: string; // Generic trackable entity ID
  previousState: GeofenceState;
  currentState: GeofenceState;
  eventType: GeofenceEventType;
  locationEvent: LocationEvent;
  timestamp: string; // ISO 8601 UTC
  dwellDurationSeconds?: number;
  metadata?: Record<string, unknown>;
}

export type GeofenceEventListener = (event: GeofenceEvent) => void;
