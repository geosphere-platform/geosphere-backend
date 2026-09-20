/**
 * Phase 21 — GPS Telemetry Ingestion API Integration Tests
 *
 * Verifies the POST /api/v1/telemetry/gps endpoint handling heterogeneous
 * payloads, deduplication, and PostGIS real-time engine dispatch.
 */

import assert from "assert";
import { NextRequest } from "next/server";
import { POST as handleGpsTelemetryPost } from "../../app/api/v1/telemetry/gps/route";
import { gpsAdapterRegistry } from "../../core/gis/realtime/adapters";

export async function runGpsTelemetryApiTests() {
  console.log("------------------------------------------");
  console.log("RUNNING GPS TELEMETRY INGESTION API TESTS");
  console.log("------------------------------------------");

  gpsAdapterRegistry.clearCache();

  // 1. Valid REST Webhook GPS Telemetry Ingestion
  console.log("  [1/4] Testing POST /api/v1/telemetry/gps with REST JSON Payload...");
  const validPayload = {
    subjectId: "veh-api-test-1",
    latitude: 21.1458,
    longitude: 79.0882,
    speed: 15.0,
    heading: 90,
    timestamp: new Date().toISOString(),
  };

  const req1 = new NextRequest("http://localhost:3000/api/v1/telemetry/gps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "dev-test-key-12345",
      "x-tenant-id": "test-tenant-0001",
    },
    body: JSON.stringify(validPayload),
  });

  const res1 = await handleGpsTelemetryPost(req1);
  assert.strictEqual(res1.status, 200);
  const json1 = await res1.json();
  assert.strictEqual(json1.success, true);
  assert.strictEqual(json1.data.processedCount, 1);
  assert.strictEqual(json1.data.duplicateCount, 0);
  console.log("  ✓ REST JSON telemetry accepted and processed by API");

  // 2. Deduplication on Rapid Re-transmission
  console.log("  [2/4] Testing Duplicate Event Suppression on Immediate Retry...");
  const req2 = new NextRequest("http://localhost:3000/api/v1/telemetry/gps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "dev-test-key-12345",
      "x-tenant-id": "test-tenant-0001",
    },
    body: JSON.stringify(validPayload), // Identical timestamp
  });

  const res2 = await handleGpsTelemetryPost(req2);
  assert.strictEqual(res2.status, 200);
  const json2 = await res2.json();
  assert.strictEqual(json2.success, true);
  assert.strictEqual(json2.data.processedCount, 0);
  assert.strictEqual(json2.data.duplicateCount, 1);
  console.log("  ✓ Duplicate telemetry event suppressed without database duplication");

  // 3. Batch Array Telemetry Ingestion
  console.log("  [3/4] Testing Batch Telemetry Ingestion Array...");
  const batchPayload = [
    {
      deviceId: "veh-batch-A",
      lat: 21.10,
      lon: 79.05,
      spd: 12,
      heading: 180,
      timestamp: new Date(Date.now() + 1000).toISOString(),
    },
    {
      deviceId: "veh-batch-B",
      lat: 21.15,
      lon: 79.10,
      spd: 18,
      heading: 270,
      timestamp: new Date(Date.now() + 1000).toISOString(),
    },
  ];

  const req3 = new NextRequest("http://localhost:3000/api/v1/telemetry/gps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "dev-test-key-12345",
      "x-tenant-id": "test-tenant-0001",
    },
    body: JSON.stringify(batchPayload),
  });

  const res3 = await handleGpsTelemetryPost(req3);
  assert.strictEqual(res3.status, 200);
  const json3 = await res3.json();
  assert.strictEqual(json3.success, true);
  assert.strictEqual(json3.data.processedCount, 2);
  console.log("  ✓ Batch telemetry array ingested 2 vehicles concurrently");

  // 4. Invalid Payload / Missing Coordinates Handling
  console.log("  [4/4] Testing Invalid Telemetry Payload Handling...");
  const req4 = new NextRequest("http://localhost:3000/api/v1/telemetry/gps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "dev-test-key-12345",
      "x-tenant-id": "test-tenant-0001",
    },
    body: JSON.stringify({ invalid: "data-without-coords" }),
  });

  const res4 = await handleGpsTelemetryPost(req4);
  assert.strictEqual(res4.status, 422);
  console.log("  ✓ API returned HTTP 422 for unparseable telemetry payload");

  console.log("✅ GPS TELEMETRY INGESTION API TESTS PASSED SUCCESSFULLY!");
}
