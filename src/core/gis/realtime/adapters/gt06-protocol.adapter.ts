/**
 * GeoSphere Platform — GT06 / Coban / TK103 GPS Protocol Adapter
 *
 * Industrial IoT binary/hex protocol parser for standard GPS trackers (GT06, Concox, Coban).
 * Decodes login IMEI packets (0x01) and location packets (0x12 / 0x22), computing coordinate
 * projection, speed, heading, and satellite fix statuses.
 */

import { LocationUpdate } from "../location-update.model";
import { IGpsDeviceAdapter, RawGpsPayload } from "./gps-adapter.interface";

export class Gt06ProtocolAdapter implements IGpsDeviceAdapter {
  public readonly protocol = "gt06";
  public readonly name = "GT06 / Coban Binary GPS Protocol Adapter";

  // Cache mapping terminal connection or serial to IMEI
  private imeiCache: Map<string, string> = new Map();

  public canHandle(payload: RawGpsPayload): boolean {
    if (payload.protocol === "gt06") return true;

    // Check header
    if (payload.headers?.["x-gps-protocol"] === "gt06") return true;

    // Check if data is hex string or buffer starting with 7878 or 7979
    if (typeof payload.data === "string") {
      const trimmed = payload.data.trim().toLowerCase();
      if (trimmed.startsWith("7878") || trimmed.startsWith("7979")) {
        return true;
      }
    }

    if (Buffer.isBuffer(payload.data) || payload.data instanceof Uint8Array) {
      const buf = payload.data;
      if (buf.length >= 4 && ((buf[0] === 0x78 && buf[1] === 0x78) || (buf[0] === 0x79 && buf[1] === 0x79))) {
        return true;
      }
    }

    if (typeof payload.data === "object" && payload.data !== null) {
      const obj = payload.data as Record<string, unknown>;
      if (typeof obj.hex === "string" && (obj.hex.startsWith("7878") || obj.hex.startsWith("7979"))) {
        return true;
      }
    }

    return false;
  }

  public parse(payload: RawGpsPayload): LocationUpdate[] {
    const buffer = this.toBuffer(payload.data);
    if (!buffer || buffer.length < 5) return [];

    let offset = 0;
    const isExtended = buffer[0] === 0x79 && buffer[1] === 0x79;
    offset += 2; // skip start bits 7878 or 7979

    const length = isExtended ? buffer.readUInt16BE(offset) : buffer.readUInt8(offset);
    offset += isExtended ? 2 : 1;

    if (buffer.length < offset + length) return [];

    const protocolNumber = buffer.readUInt8(offset);
    offset += 1;

    // 0x01: Login Packet (Contains 8-byte BCD encoded IMEI)
    if (protocolNumber === 0x01) {
      const imeiBytes = buffer.subarray(offset, offset + 8);
      const imei = this.decodeBcd(imeiBytes);
      const tenantKey = payload.tenantId ?? "default";
      this.imeiCache.set(tenantKey, imei);
      return [];
    }

    // 0x12 (Location Data) or 0x22 (GPS + LBS combined)
    if (protocolNumber === 0x12 || protocolNumber === 0x22) {
      // Date & Time (6 bytes: YY MM DD HH MM SS)
      const year = 2000 + buffer.readUInt8(offset);
      const month = buffer.readUInt8(offset + 1) - 1; // 0-indexed in JS Date
      const day = buffer.readUInt8(offset + 2);
      const hours = buffer.readUInt8(offset + 3);
      const minutes = buffer.readUInt8(offset + 4);
      const seconds = buffer.readUInt8(offset + 5);
      const timestampIso = new Date(Date.UTC(year, month, day, hours, minutes, seconds)).toISOString();
      offset += 6;

      // Quantity of GPS satellites (1 byte)
      const satByte = buffer.readUInt8(offset);
      const satellites = satByte & 0x0f;
      offset += 1;

      // Latitude (4 bytes: value / 1800000)
      const rawLat = buffer.readUInt32BE(offset);
      let latitude = rawLat / 1800000.0;
      offset += 4;

      // Longitude (4 bytes: value / 1800000)
      const rawLon = buffer.readUInt32BE(offset);
      let longitude = rawLon / 1800000.0;
      offset += 4;

      // Speed (1 byte in km/h) -> convert to m/s for standard LocationUpdate
      const speedKmh = buffer.readUInt8(offset);
      const speedMs = Math.round((speedKmh / 3.6) * 100) / 100;
      offset += 1;

      // Course and Status (2 bytes)
      const courseStatus = buffer.readUInt16BE(offset);
      const heading = courseStatus & 0x03ff; // lower 10 bits: 0 - 360 deg
      const isSouth = (courseStatus & 0x0400) === 0; // bit 10: 1 = North, 0 = South
      const isWest = (courseStatus & 0x0800) !== 0; // bit 11: 1 = West, 0 = East
      const isGpsFixed = (courseStatus & 0x1000) !== 0; // bit 12: 1 = GPS positioned
      offset += 2;

      if (isSouth) latitude = -latitude;
      if (isWest) longitude = -longitude;

      // Determine subjectId
      const tenantKey = payload.tenantId ?? "default";
      const subjectId =
        payload.query?.deviceId ||
        payload.headers?.["x-device-id"] ||
        this.imeiCache.get(tenantKey) ||
        `gt06-terminal-${rawLon.toString(16).slice(-6)}`;

      const update: LocationUpdate = {
        subjectId,
        latitude: Math.round(latitude * 1000000) / 1000000,
        longitude: Math.round(longitude * 1000000) / 1000000,
        speed: speedMs,
        heading,
        timestamp: timestampIso,
        source: "gt06",
        metadata: {
          speedKmh,
          satellites,
          isGpsFixed,
          protocol: "GT06",
        },
      };

      return [update];
    }

    return [];
  }

  private toBuffer(data: unknown): Buffer | null {
    if (Buffer.isBuffer(data)) return data;
    if (data instanceof Uint8Array) return Buffer.from(data);

    if (typeof data === "string") {
      const hex = data.trim();
      if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
        return Buffer.from(hex, "hex");
      }
    }

    if (typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>;
      if (typeof obj.hex === "string") {
        return this.toBuffer(obj.hex);
      }
    }

    return null;
  }

  private decodeBcd(bytes: Buffer): string {
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
      const high = (bytes[i] >> 4) & 0x0f;
      const low = bytes[i] & 0x0f;
      result += high.toString(16) + low.toString(16);
    }
    // Drop leading zero or padding if standard 15-digit IMEI
    return result.replace(/^0+/, "");
  }
}
