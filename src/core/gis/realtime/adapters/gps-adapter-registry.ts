/**
 * GeoSphere Platform — GPS Device Adapter Registry & Ingestion Pipeline
 *
 * Central registry that dynamically routes incoming raw GPS packets (REST, Webhook, GT06, MQTT)
 * to appropriate protocol adapters, performs deduplication and stale validation, and returns
 * clean LocationUpdate domain models.
 */

import { LocationUpdate } from "../location-update.model";
import { IGpsDeviceAdapter, RawGpsPayload } from "./gps-adapter.interface";
import { RestWebhookAdapter } from "./rest-webhook.adapter";
import { Gt06ProtocolAdapter } from "./gt06-protocol.adapter";
import { GenericMqttAdapter } from "./generic-mqtt.adapter";

export interface IngestionFilterResult {
  accepted: LocationUpdate[];
  duplicates: number;
  stale: number;
}

export class GpsAdapterRegistry {
  private static instance: GpsAdapterRegistry;
  private adapters: IGpsDeviceAdapter[] = [];

  // Deduplication cache: key = `${tenantId}:${subjectId}`, value = lastTimestampMs
  private lastSeenTimestamps: Map<string, number> = new Map();

  // Deduplication cache: key = `${tenantId}:${subjectId}:${lat}:${lon}`, value = lastTimestampMs
  private lastSeenCoords: Map<string, number> = new Map();

  private constructor() {
    // Register default built-in adapters (Order matters: specific binary/mqtt first, fallback webhook last)
    this.adapters.push(new Gt06ProtocolAdapter());
    this.adapters.push(new GenericMqttAdapter());
    this.adapters.push(new RestWebhookAdapter());
  }

  public static getInstance(): GpsAdapterRegistry {
    if (!GpsAdapterRegistry.instance) {
      GpsAdapterRegistry.instance = new GpsAdapterRegistry();
    }
    return GpsAdapterRegistry.instance;
  }

  public registerAdapter(adapter: IGpsDeviceAdapter): void {
    this.adapters.unshift(adapter); // Prioritize custom adapters
  }

  public getAdapters(): IGpsDeviceAdapter[] {
    return [...this.adapters];
  }

  public resolveAdapter(payload: RawGpsPayload): IGpsDeviceAdapter {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(payload)) {
        return adapter;
      }
    }
    // Default fallback to webhook adapter
    return this.adapters[this.adapters.length - 1];
  }

  /**
   * Parse raw payload into normalized LocationUpdate records using matched adapter.
   */
  public parse(payload: RawGpsPayload): LocationUpdate[] {
    const adapter = this.resolveAdapter(payload);
    return adapter.parse(payload);
  }

  /**
   * Filter and deduplicate incoming location updates:
   * - Suppresses duplicate timestamps for the same subject
   * - Suppresses identical coordinates within debounce window (1000ms)
   * - Suppresses stale timestamps older than 30 days or in the future >15 mins
   */
  public filterAndDeduplicate(
    tenantId: string,
    updates: LocationUpdate[],
    options: { maxPastMs?: number; maxFutureMs?: number; debounceMs?: number } = {}
  ): IngestionFilterResult {
    const maxPastMs = options.maxPastMs ?? 30 * 24 * 60 * 60 * 1000; // 30 days
    const maxFutureMs = options.maxFutureMs ?? 15 * 60 * 1000; // 15 mins
    const debounceMs = options.debounceMs ?? 1000; // 1s coordinate debounce

    const now = Date.now();
    const accepted: LocationUpdate[] = [];
    let duplicates = 0;
    let stale = 0;

    for (const update of updates) {
      const tsMs = typeof update.timestamp === "number" ? update.timestamp : new Date(update.timestamp).getTime();

      // Check Clock Skew (Stale or Future)
      if (isNaN(tsMs) || tsMs < now - maxPastMs || tsMs > now + maxFutureMs) {
        stale++;
        continue;
      }

      const subjectKey = `${tenantId}:${update.subjectId}`;
      const lastSeen = this.lastSeenTimestamps.get(subjectKey);

      // Check duplicate or out-of-order timestamp
      if (lastSeen !== undefined && tsMs <= lastSeen) {
        duplicates++;
        continue;
      }

      // Check duplicate identical coordinates within debounce window
      const coordKey = `${subjectKey}:${update.latitude.toFixed(5)}:${update.longitude.toFixed(5)}`;
      const lastCoordTime = this.lastSeenCoords.get(coordKey);
      if (lastCoordTime !== undefined && tsMs - lastCoordTime < debounceMs) {
        duplicates++;
        continue;
      }

      // Accepted!
      this.lastSeenTimestamps.set(subjectKey, tsMs);
      this.lastSeenCoords.set(coordKey, tsMs);
      accepted.push(update);

      // Prune old entries if map grows too large (>50,000)
      if (this.lastSeenTimestamps.size > 50000) {
        this.pruneCaches();
      }
    }

    return { accepted, duplicates, stale };
  }

  public clearCache(): void {
    this.lastSeenTimestamps.clear();
    this.lastSeenCoords.clear();
  }

  private pruneCaches(): void {
    const threshold = Date.now() - 3600000; // 1 hour
    for (const [key, time] of this.lastSeenTimestamps) {
      if (time < threshold) this.lastSeenTimestamps.delete(key);
    }
    for (const [key, time] of this.lastSeenCoords) {
      if (time < threshold) this.lastSeenCoords.delete(key);
    }
  }
}

export const gpsAdapterRegistry = GpsAdapterRegistry.getInstance();
