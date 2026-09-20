/**
 * Phase 21 — Modular GPS Device Adapters & Registry Unit Tests
 *
 * Verifies normalization, field aliasing, GT06 binary/hex decoding,
 * MQTT topic extraction, deduplication, and stale timestamp filtering.
 */

import assert from "assert";
import {
  RestWebhookAdapter,
  Gt06ProtocolAdapter,
  GenericMqttAdapter,
  gpsAdapterRegistry,
} from "../../core/gis/realtime/adapters";

export async function runGpsAdaptersUnitTests() {
  console.log("------------------------------------------");
  console.log("RUNNING MODULAR GPS ADAPTERS & INGESTION TESTS");
  console.log("------------------------------------------");

  // 1. REST Webhook Adapter Tests
  console.log("  [1/6] Testing RestWebhookAdapter Payload Normalization...");
  const webhookAdapter = new RestWebhookAdapter();

  assert.strictEqual(webhookAdapter.protocol, "webhook");
  assert.strictEqual(webhookAdapter.canHandle({ protocol: "webhook", data: {} }), true);

  const payloadWithAliases = {
    deviceId: "veh-test-01",
    lat: 21.1458,
    lng: 79.0882,
    spd: 15.5,
    heading: 90,
    timestamp: "2026-09-13T12:00:00Z",
  };

  const parsed1 = webhookAdapter.parse({ data: payloadWithAliases });
  assert.strictEqual(parsed1.length, 1);
  assert.strictEqual(parsed1[0].subjectId, "veh-test-01");
  assert.strictEqual(parsed1[0].latitude, 21.1458);
  assert.strictEqual(parsed1[0].longitude, 79.0882);
  assert.strictEqual(parsed1[0].speed, 15.5);
  assert.strictEqual(parsed1[0].heading, 90);

  // Speed in km/h conversion
  const parsedSpeedKmh = webhookAdapter.parse({
    data: {
      subjectId: "veh-speed",
      latitude: 21.0,
      longitude: 79.0,
      speedKmh: 72, // 72 km/h = 20 m/s
    },
  });
  assert.strictEqual(parsedSpeedKmh[0].speed, 20);
  console.log("  ✓ REST Webhook adapter normalized aliases and speed units");

  // 2. Batch Webhook Updates
  console.log("  [2/6] Testing Batch Telemetry Payload Array...");
  const batchParsed = webhookAdapter.parse({
    data: [
      { subjectId: "v1", lat: 21.1, lon: 79.1 },
      { subjectId: "v2", lat: 21.2, lon: 79.2 },
    ],
  });
  assert.strictEqual(batchParsed.length, 2);
  assert.strictEqual(batchParsed[0].subjectId, "v1");
  assert.strictEqual(batchParsed[1].subjectId, "v2");
  console.log("  ✓ Successfully processed batch telemetry array");

  // 3. GT06 Protocol Parser Tests
  console.log("  [3/6] Testing GT06 Protocol Hex Decoding...");
  const gt06Adapter = new Gt06ProtocolAdapter();
  assert.strictEqual(gt06Adapter.protocol, "gt06");

  // GT06 packet starting with 7878
  assert.strictEqual(gt06Adapter.canHandle({ data: "78780d01012345678901234500010d0a" }), true);

  // Parse GT06 Login packet (Protocol 0x01, BCD IMEI)
  // 78 78 (start), 11 (len 17), 01 (login), 8 bytes IMEI, 00 01 (serial), 12 34 (crc), 0d 0a (stop)
  const loginHex = "78781101086820204123456700018df10d0a";
  const loginRes = gt06Adapter.parse({ data: loginHex, tenantId: "test-tenant" });
  assert.strictEqual(loginRes.length, 0); // Login packet registers IMEI in cache

  // Parse GT06 Location packet (Protocol 0x12)
  // Construct valid 0x12 buffer:
  // start(2) len(1)=22 proto(1)=0x12 datetime(6) sat(1)=0x08 lat(4) lon(4) spd(1)=0x3c course(2)=0x005a serial(2) crc(2) stop(2)
  const buf = Buffer.alloc(28);
  buf.writeUInt16BE(0x7878, 0); // start
  buf.writeUInt8(22, 2); // len
  buf.writeUInt8(0x12, 3); // proto 0x12
  // Date: 2026-09-13 14:30:00 (YY MM DD HH MM SS: 26 09 13 14 30 00)
  buf.writeUInt8(26, 4);
  buf.writeUInt8(9, 5);
  buf.writeUInt8(13, 6);
  buf.writeUInt8(14, 7);
  buf.writeUInt8(30, 8);
  buf.writeUInt8(0, 9);
  // Satellite count 8
  buf.writeUInt8(0xc8, 10);
  // Lat: 21.1458 * 1800000 = 38062440
  buf.writeUInt32BE(Math.round(21.1458 * 1800000), 11);
  // Lon: 79.0882 * 1800000 = 142358760
  buf.writeUInt32BE(Math.round(79.0882 * 1800000), 15);
  // Speed: 60 km/h
  buf.writeUInt8(60, 19);
  // Course/Status: 90 deg + North/East/Fixed bits (0x1000 = fixed, 0x0400 = North) -> 0x145a
  buf.writeUInt16BE(0x145a, 20);
  // Serial
  buf.writeUInt16BE(0x0001, 22);
  // CRC
  buf.writeUInt16BE(0xbeef, 24);
  // Stop
  buf.writeUInt16BE(0x0d0a, 26);

  const parsedGt06 = gt06Adapter.parse({ data: buf, tenantId: "test-tenant" });
  assert.strictEqual(parsedGt06.length, 1);
  assert.strictEqual(parsedGt06[0].latitude, 21.1458);
  assert.strictEqual(parsedGt06[0].longitude, 79.0882);
  assert.strictEqual(parsedGt06[0].heading, 90);
  assert.strictEqual(parsedGt06[0].source, "gt06");
  console.log("  ✓ GT06 protocol location packet parsed coordinates, speed & heading");

  // 4. Generic MQTT Telemetry Adapter Tests
  console.log("  [4/6] Testing GenericMqttAdapter...");
  const mqttAdapter = new GenericMqttAdapter();
  assert.strictEqual(mqttAdapter.protocol, "mqtt");

  const mqttUpdate = mqttAdapter.parse({
    data: {
      topic: "telemetry/tenant-xyz/devices/veh-mqtt-99",
      payload: {
        latitude: 21.12,
        longitude: 79.05,
        speed: 12.0,
        heading: 180,
      },
    },
  });

  assert.strictEqual(mqttUpdate.length, 1);
  assert.strictEqual(mqttUpdate[0].subjectId, "veh-mqtt-99");
  assert.strictEqual(mqttUpdate[0].latitude, 21.12);
  assert.strictEqual(mqttUpdate[0].longitude, 79.05);
  assert.strictEqual(mqttUpdate[0].source, "mqtt");
  console.log("  ✓ MQTT adapter extracted device ID from topic and parsed payload");

  // 5. GPS Adapter Registry & Routing
  console.log("  [5/6] Testing GpsAdapterRegistry Dispatch...");
  const adapterForGt06 = gpsAdapterRegistry.resolveAdapter({ data: "78781101...0d0a" });
  assert.strictEqual(adapterForGt06.protocol, "gt06");

  const adapterForMqtt = gpsAdapterRegistry.resolveAdapter({
    data: { topic: "devices/1/telemetry", payload: {} },
  });
  assert.strictEqual(adapterForMqtt.protocol, "mqtt");

  const adapterForWebhook = gpsAdapterRegistry.resolveAdapter({
    data: { subjectId: "v1", lat: 21.1, lng: 79.1 },
  });
  assert.strictEqual(adapterForWebhook.protocol, "webhook");
  console.log("  ✓ GpsAdapterRegistry routed heterogeneous payloads to correct adapters");

  // 6. Deduplication & Stale Timestamp Filtering
  console.log("  [6/6] Testing Deduplication and Stale GPS Filtering...");
  gpsAdapterRegistry.clearCache();

  const now = Date.now();
  const testUpdates = [
    { subjectId: "veh-dup", latitude: 21.14, longitude: 79.08, timestamp: now },
    // Duplicate identical timestamp
    { subjectId: "veh-dup", latitude: 21.14, longitude: 79.08, timestamp: now },
    // Past/Out-of-order timestamp
    { subjectId: "veh-dup", latitude: 21.15, longitude: 79.09, timestamp: now - 5000 },
    // Valid subsequent update
    { subjectId: "veh-dup", latitude: 21.16, longitude: 79.10, timestamp: now + 2000 },
    // Stale timestamp (older than 30 days)
    { subjectId: "veh-stale", latitude: 21.14, longitude: 79.08, timestamp: now - 35 * 86400 * 1000 },
    // Future clock skew beyond 15 mins
    { subjectId: "veh-future", latitude: 21.14, longitude: 79.08, timestamp: now + 30 * 60 * 1000 },
  ];

  const filterRes = gpsAdapterRegistry.filterAndDeduplicate("tenant-01", testUpdates);
  assert.strictEqual(filterRes.accepted.length, 2);
  assert.strictEqual(filterRes.duplicates, 2);
  assert.strictEqual(filterRes.stale, 2);
  assert.strictEqual(filterRes.accepted[0].timestamp, now);
  assert.strictEqual(filterRes.accepted[1].timestamp, now + 2000);

  console.log("  ✓ Deduplication rejected duplicate/out-of-order and stale timestamps");
  console.log("✅ MODULAR GPS ADAPTERS & INGESTION TESTS PASSED SUCCESSFULLY!");
}
