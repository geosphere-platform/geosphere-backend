/**
 * GeoSphere Platform — Generic MQTT Telemetry GPS Adapter
 *
 * Translates MQTT telemetry publications from IoT brokers (AWS IoT Core, HiveMQ, EMQX)
 * into standard GeoSphere LocationUpdate records.
 */

import { LocationUpdate } from "../location-update.model";
import { IGpsDeviceAdapter, RawGpsPayload } from "./gps-adapter.interface";
import { RestWebhookAdapter } from "./rest-webhook.adapter";

export class GenericMqttAdapter implements IGpsDeviceAdapter {
  public readonly protocol = "mqtt";
  public readonly name = "Generic MQTT Telemetry GPS Adapter";

  private webhookFallback = new RestWebhookAdapter();

  public canHandle(payload: RawGpsPayload): boolean {
    if (payload.protocol === "mqtt") return true;

    // Check if topic is provided in headers or query or data
    if (payload.headers?.["x-mqtt-topic"]) return true;

    if (typeof payload.data === "object" && payload.data !== null) {
      const obj = payload.data as Record<string, unknown>;
      if (typeof obj.topic === "string" && obj.payload !== undefined) {
        return true;
      }
    }

    return false;
  }

  public parse(payload: RawGpsPayload): LocationUpdate[] {
    let topic = payload.headers?.["x-mqtt-topic"] || payload.query?.topic || "";
    let dataPayload = payload.data;

    if (typeof payload.data === "object" && payload.data !== null) {
      const obj = payload.data as Record<string, unknown>;
      if (typeof obj.topic === "string") {
        topic = obj.topic;
        dataPayload = obj.payload ?? obj.data ?? obj;
      }
    }

    // Extract device ID from topic segments (e.g. "telemetry/tenant1/device123" or "devices/device123/telemetry")
    let extractedDeviceId = "";
    if (topic) {
      const parts = topic.split("/");
      const devIndex = parts.indexOf("devices");
      if (devIndex !== -1 && parts[devIndex + 1] && parts[devIndex + 1] !== "me") {
        extractedDeviceId = parts[devIndex + 1];
      } else if (parts.length >= 3 && parts[0] === "telemetry") {
        extractedDeviceId = parts[2];
      } else if (parts.length >= 2) {
        extractedDeviceId = parts[parts.length - 1] === "telemetry" ? parts[parts.length - 2] : parts[parts.length - 1];
      }
    }

    // If payload is string JSON, parse it
    if (typeof dataPayload === "string") {
      try {
        dataPayload = JSON.parse(dataPayload);
      } catch {
        return [];
      }
    }

    // Inject extractedDeviceId if missing
    if (extractedDeviceId && typeof dataPayload === "object" && dataPayload !== null) {
      const obj = dataPayload as Record<string, unknown>;
      if (!obj.subjectId && !obj.deviceId && !obj.imei && !obj.vehicleId) {
        obj.subjectId = extractedDeviceId;
      }
    }

    // Delegate parsing to JSON schema normalizer
    const updates = this.webhookFallback.parse({
      protocol: "webhook",
      data: dataPayload,
      headers: payload.headers,
      query: payload.query,
      tenantId: payload.tenantId,
    });

    return updates.map((u) => ({ ...u, source: "mqtt" }));
  }
}
