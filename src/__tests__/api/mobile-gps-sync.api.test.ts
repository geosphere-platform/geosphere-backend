/**
 * GeoSphere Platform — Mobile KMP & Backend Telemetry Ingestion Integration Test Suite
 *
 * Verifies that the KMP Mobile App's live GPS telemetry payload, offline batch queue,
 * deduplication, and PostGIS real-time engine dispatch succeed completely.
 */

import assert from "assert";
import { NextRequest } from "next/server";
import { POST as handleGpsTelemetryPost } from "../../app/api/v1/telemetry/gps/route";
import { gpsAdapterRegistry } from "../../core/gis/realtime/adapters";

export async function runMobileGpsSyncApiTests(): Promise<void> {
  console.log("----------------------------------------------------------");
  console.log("RUNNING MOBILE KMP LIVE GPS & CLOUD SYNC API TESTS");
  console.log("----------------------------------------------------------");

  gpsAdapterRegistry.clearCache();

  // Test 1: Mobile App Live Single Telemetry Ingestion (Single Fix from KMP engine)
  console.log("  [1/4] Testing Mobile KMP Single Fix Ingestion (POST /api/v1/telemetry/gps)...");
  const singleMobileFix = {
    subjectId: "veh-kmp-mobile-01",
    deviceId: "android-pixel-7a-kmp",
    tenantId: "test-tenant-0001",
    latitude: 21.1458,
    longitude: 79.0882,
    altitude: 312.0,
    speed: 12.5,
    speedKmh: 45.0,
    heading: 180.0,
    accuracy: 4.2,
    batteryPct: 88,
    isCharging: true,
    timestamp: new Date().toISOString(),
    source: "mobile-kmp-app",
  };

  const req1 = new NextRequest("http://localhost:3000/api/v1/telemetry/gps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Tenant-ID": "test-tenant-0001",
      "x-api-key": "kmp-device-token-12345",
      "X-Idempotency-Key": "tx_kmp_single_001",
    },
    body: JSON.stringify(singleMobileFix),
  });

  const res1 = await handleGpsTelemetryPost(req1);
  assert.strictEqual(res1.status, 200, "Should return HTTP 200");
  const json1 = await res1.json();
  assert.strictEqual(json1.success, true);
  assert.strictEqual(json1.data.processedCount, 1, "Should process 1 record");
  console.log("  ✓ Mobile single GPS fix successfully ingested into PostGIS pipeline");

  // Test 2: Mobile Offline Queue Batch Flush (Array of queued fixes)
  console.log("  [2/4] Testing Mobile KMP Offline Queue Batch Array Ingestion...");
  const baseTime = Date.now();
  const offlineQueueBatch = [
    {
      subjectId: "veh-kmp-mobile-02",
      deviceId: "ios-iphone-15-kmp",
      tenantId: "test-tenant-0001",
      latitude: 21.1400,
      longitude: 79.0800,
      altitude: 310.0,
      speed: 10.0,
      speedKmh: 36.0,
      heading: 90.0,
      accuracy: 3.5,
      batteryPct: 75,
      isCharging: false,
      timestamp: new Date(baseTime - 30000).toISOString(),
      source: "mobile-kmp-app",
    },
    {
      subjectId: "veh-kmp-mobile-02",
      deviceId: "ios-iphone-15-kmp",
      tenantId: "test-tenant-0001",
      latitude: 21.1420,
      longitude: 79.0830,
      altitude: 311.0,
      speed: 15.0,
      speedKmh: 54.0,
      heading: 95.0,
      accuracy: 3.8,
      batteryPct: 74,
      isCharging: false,
      timestamp: new Date(baseTime - 15000).toISOString(),
      source: "mobile-kmp-app",
    },
    {
      subjectId: "veh-kmp-mobile-02",
      deviceId: "ios-iphone-15-kmp",
      tenantId: "test-tenant-0001",
      latitude: 21.1450,
      longitude: 79.0860,
      altitude: 312.0,
      speed: 18.0,
      speedKmh: 64.8,
      heading: 100.0,
      accuracy: 4.0,
      batteryPct: 73,
      isCharging: false,
      timestamp: new Date(baseTime).toISOString(),
      source: "mobile-kmp-app",
    },
  ];

  const req2 = new NextRequest("http://localhost:3000/api/v1/telemetry/gps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Tenant-ID": "test-tenant-0001",
      "x-api-key": "kmp-device-token-12345",
      "X-Idempotency-Key": "batch_kmp_offline_99",
    },
    body: JSON.stringify(offlineQueueBatch),
  });

  const res2 = await handleGpsTelemetryPost(req2);
  assert.strictEqual(res2.status, 200, "Batch flush should return HTTP 200");
  const json2 = await res2.json();
  assert.strictEqual(json2.success, true);
  assert.strictEqual(json2.data.processedCount, 3, "All 3 offline fixes in batch should be processed");
  console.log("  ✓ Mobile offline queue batch array of 3 fixes ingested and upserted");

  // Test 3: Deduplication Protection on Retransmission
  console.log("  [3/4] Testing Idempotency & Deduplication on Retry...");
  const req3 = new NextRequest("http://localhost:3000/api/v1/telemetry/gps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Tenant-ID": "test-tenant-0001",
      "x-api-key": "kmp-device-token-12345",
      "X-Idempotency-Key": "tx_kmp_single_001_retry",
    },
    body: JSON.stringify(singleMobileFix), // Exact same timestamp
  });

  const res3 = await handleGpsTelemetryPost(req3);
  assert.strictEqual(res3.status, 200);
  const json3 = await res3.json();
  assert.strictEqual(json3.data.processedCount, 0, "Duplicate timestamp fix must not be re-processed");
  assert.strictEqual(json3.data.duplicateCount, 1, "Should identify 1 duplicate");
  console.log("  ✓ Duplicate telemetry fix successfully filtered without PostGIS duplication");

  // Test 4: Schema Boundary & Validation Protection
  console.log("  [4/4] Testing Unparseable Payload Rejection (HTTP 422)...");
  const req4 = new NextRequest("http://localhost:3000/api/v1/telemetry/gps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": "test-tenant-0001",
      "x-api-key": "kmp-device-token-12345",
    },
    body: JSON.stringify({ invalidField: "no-coordinates-provided" }),
  });

  const res4 = await handleGpsTelemetryPost(req4);
  assert.strictEqual(res4.status, 422, "Invalid schema should return HTTP 422");
  console.log("  ✓ Gateway correctly rejected malformed telemetry with HTTP 422");

  console.log("✅ MOBILE KMP LIVE GPS & CLOUD SYNC API TESTS PASSED SUCCESSFULLY!");
}

// Standalone runner
if (process.argv[1]?.includes("mobile-gps-sync.api.test")) {
  runMobileGpsSyncApiTests().catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  });
}
