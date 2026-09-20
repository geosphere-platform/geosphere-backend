/**
 * SpatialEvent & RealtimeEventEnvelope Domain Models
 *
 * Generic event representation for real-time location streaming and spatial transitions.
 */

import { Geometry } from "../types/geometry";

export type SpatialEventType =
  | "LOCATION_UPDATED"
  | "SPATIAL_ENTER"
  | "SPATIAL_EXIT"
  | "SPATIAL_PROXIMITY_ENTER"
  | "SPATIAL_PROXIMITY_EXIT"
  | (string & {});

export interface SpatialEvent {
  id: string;
  tenantId: string;
  type: SpatialEventType;
  subjectId: string;
  geometry?: Geometry;
  timestamp: string; // ISO 8601 UTC
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RealtimeEventEnvelope<T = Record<string, unknown>> {
  eventId: string;
  eventType: SpatialEventType;
  timestamp: string;
  tenantId: string;
  subjectId: string;
  payload: T;
  version: 1;
}

export type ChannelType = "tenant" | "subject" | "map" | "layer";

export interface ChannelSubscription {
  channelType: ChannelType;
  channelId: string;
}
