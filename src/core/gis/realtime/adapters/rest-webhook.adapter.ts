/**
 * GeoSphere Platform — REST / Webhook GPS Adapter
 *
 * Normalizes HTTP JSON payloads from telemetry hardware, GPS trackers, mobile applications,
 * and external webhook integrations into standard LocationUpdate records.
 */

import { LocationUpdate } from "../location-update.model";
import { IGpsDeviceAdapter, RawGpsPayload } from "./gps-adapter.interface";

export class RestWebhookAdapter implements IGpsDeviceAdapter {
  public readonly protocol = "webhook";
  public readonly name = "Standard REST Webhook Adapter";

  public canHandle(payload: RawGpsPayload): boolean {
    if (payload.protocol === "webhook" || payload.protocol === "generic") {
      return true;
    }

    if (payload.headers?.["content-type"]?.includes("application/json") || typeof payload.data === "object") {
      const data = payload.data as Record<string, unknown>;
      if (!data) return false;

      // Check if it has lat/lng or coordinate indicators
      const hasSubject = "subjectId" in data || "deviceId" in data || "imei" in data || "vehicleId" in data || "id" in data;
      const hasCoords = ("latitude" in data || "lat" in data) && ("longitude" in data || "lng" in data || "lon" in data);
      return Boolean(hasSubject && hasCoords);
    }

    return false;
  }

  public parse(payload: RawGpsPayload): LocationUpdate[] {
    const raw = payload.data;
    const items = Array.isArray(raw) ? raw : [raw];
    const results: LocationUpdate[] = [];

    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const obj = item as Record<string, unknown>;

      const subjectId = String(
        obj.subjectId || obj.deviceId || obj.imei || obj.trackerId || obj.vehicleId || obj.id || ""
      ).trim();

      if (!subjectId) continue;

      const lat = Number(obj.latitude ?? obj.lat);
      const lon = Number(obj.longitude ?? obj.lng ?? obj.lon);

      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        continue;
      }

      // Resolve Speed (convert km/h to m/s if speedKmh is given, or use speed directly)
      let speed: number | undefined;
      if (typeof obj.speedKmh === "number" && !isNaN(obj.speedKmh)) {
        speed = Math.round((obj.speedKmh / 3.6) * 100) / 100;
      } else if (typeof obj.speed === "number" && !isNaN(obj.speed)) {
        speed = Math.round(obj.speed * 100) / 100;
      } else if (typeof obj.spd === "number" && !isNaN(obj.spd)) {
        speed = Math.round(obj.spd * 100) / 100;
      }

      // Resolve Heading
      let heading: number | undefined;
      const rawHeading = obj.heading ?? obj.bearing ?? obj.course ?? obj.dir;
      if (typeof rawHeading === "number" && !isNaN(rawHeading)) {
        heading = ((rawHeading % 360) + 360) % 360;
      }

      // Resolve Timestamp
      const rawTs = obj.timestamp ?? obj.recordedAt ?? obj.time ?? obj.ts ?? Date.now();
      let timestamp: string | number = rawTs as string | number;
      if (typeof timestamp === "string" && !isNaN(Number(timestamp)) && timestamp.length >= 10) {
        timestamp = Number(timestamp);
      }

      const altitude = typeof obj.altitude === "number" ? obj.altitude : typeof obj.alt === "number" ? obj.alt : undefined;
      const accuracy = typeof obj.accuracy === "number" ? obj.accuracy : typeof obj.acc === "number" ? obj.acc : undefined;

      const metadata: Record<string, unknown> = {
        battery: obj.batteryPct ?? obj.battery,
        fuel: obj.fuelPct ?? obj.fuel,
        ignition: obj.ignition,
        satellites: obj.satellites ?? obj.satelliteCount,
        licensePlate: obj.licensePlate,
        driverName: obj.driverName,
        ...(typeof obj.metadata === "object" && obj.metadata !== null ? (obj.metadata as Record<string, unknown>) : {}),
      };

      results.push({
        subjectId,
        latitude: lat,
        longitude: lon,
        speed,
        heading,
        altitude,
        accuracy,
        timestamp,
        source: "webhook",
        metadata,
      });
    }

    return results;
  }
}
