/**
 * GeoSphere Platform — Modular GPS Device Adapter Contracts
 *
 * Provides a framework-agnostic contract for normalizing heterogeneous GPS data sources
 * (REST webhooks, GT06 binary/hex tracker packets, MQTT telemetries) into standard
 * GeoSphere LocationUpdate records.
 */

import { LocationUpdate } from "../location-update.model";

export type GpsProtocol = "webhook" | "gt06" | "mqtt" | "generic" | (string & {});

export interface RawGpsPayload {
  protocol?: GpsProtocol;
  data: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  tenantId?: string;
}

export interface IGpsDeviceAdapter {
  readonly protocol: string;
  readonly name: string;

  /**
   * Determine if this adapter can process the raw incoming payload.
   */
  canHandle(payload: RawGpsPayload): boolean;

  /**
   * Parse the raw payload into one or more normalized LocationUpdate domain models.
   */
  parse(payload: RawGpsPayload): LocationUpdate[];
}
