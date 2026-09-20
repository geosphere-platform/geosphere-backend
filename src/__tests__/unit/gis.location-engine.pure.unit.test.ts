/**
 * Location Engine Pure Domain & Validator Unit Tests
 *
 * Tests coordinate validation (lat/lng/accuracy/speed/heading/timestamp), LocationEvent creation,
 * quality assessment, error normalization, sampling configurations, and location stream lifecycle
 * without requiring browser DOM, React, Next.js, or native platform runtimes.
 */

import {
  Location,
  LocationEvent,
  LocationError,
  LocationValidator,
  MockLocationProvider,
  WebLocationAdapter,
  LocationEngine,
} from "../../core/gis/location";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runLocationEnginePureUnitTests(): void {
  console.log("------------------------------------------");
  console.log("RUNNING LOCATION ENGINE PURE DOMAIN & VALIDATION TESTS");
  console.log("------------------------------------------");

  // 1 & 2. Valid and Invalid Latitude
  console.log("  [1/21] Testing Latitude Validation...");
  LocationValidator.validateLatitude(28.6139);
  LocationValidator.validateLatitude(-90);
  LocationValidator.validateLatitude(90);
  let threwLat = false;
  try {
    LocationValidator.validateLatitude(95);
  } catch (e: any) {
    threwLat = true;
    assert(e instanceof LocationError && e.code === "INVALID_LOCATION", "Should throw LocationError INVALID_LOCATION");
  }
  assert(threwLat, "Invalid latitude > 90 must throw exception");

  // 3 & 4. Valid and Invalid Longitude
  console.log("  [2/21] Testing Longitude Validation...");
  LocationValidator.validateLongitude(77.209);
  LocationValidator.validateLongitude(-180);
  LocationValidator.validateLongitude(180);
  let threwLng = false;
  try {
    LocationValidator.validateLongitude(-185);
  } catch (e: any) {
    threwLng = true;
    assert(e instanceof LocationError && e.code === "INVALID_LOCATION", "Should throw LocationError INVALID_LOCATION");
  }
  assert(threwLng, "Invalid longitude < -180 must throw exception");

  // 5 & 6. Valid and Invalid Timestamp
  console.log("  [3/21] Testing Timestamp Validation...");
  const validIso = "2026-08-18T10:00:00.000Z";
  const parsedMs = LocationValidator.parseTimestampMs(validIso);
  assert(parsedMs > 0, "Valid ISO timestamp must parse to positive ms");

  let threwTs = false;
  try {
    LocationValidator.parseTimestampMs("not-a-timestamp");
  } catch (e) {
    threwTs = true;
  }
  assert(threwTs, "Invalid timestamp string must throw exception");

  // 7 & 8. Optional and Invalid Accuracy
  console.log("  [4/21] Testing Accuracy Validation...");
  LocationValidator.validateAccuracy(15.5);
  LocationValidator.validateAccuracy(0);
  LocationValidator.validateAccuracy(null);
  let threwAcc = false;
  try {
    LocationValidator.validateAccuracy(-5);
  } catch (e) {
    threwAcc = true;
  }
  assert(threwAcc, "Negative accuracy must throw exception");

  // 9 & 10. Optional and Invalid Speed
  console.log("  [5/21] Testing Speed Validation...");
  LocationValidator.validateSpeed(22.4);
  LocationValidator.validateSpeed(0);
  let threwSpeed = false;
  try {
    LocationValidator.validateSpeed(-10);
  } catch (e) {
    threwSpeed = true;
  }
  assert(threwSpeed, "Negative speed must throw exception");

  // 11. Optional Heading Normalization
  console.log("  [6/21] Testing Heading Normalization...");
  assert(LocationValidator.normalizeHeading(45) === 45, "Heading 45 should normalize to 45");
  assert(LocationValidator.normalizeHeading(390) === 30, "Heading 390 should normalize to 30");
  assert(LocationValidator.normalizeHeading(-90) === 270, "Heading -90 should normalize to 270");

  // 12. Location Source
  console.log("  [7/21] Testing Location Source Identification...");
  const sampleLoc: Location = {
    latitude: 28.6139,
    longitude: 77.209,
    timestamp: Date.now(),
    source: "mobile-gps",
  };
  LocationValidator.validateLocation(sampleLoc);
  assert(sampleLoc.source === "mobile-gps", "Location source must match mobile-gps");

  // 13 & 14. LocationEvent Creation & Validation
  console.log("  [8/21] Testing LocationEvent Creation & Envelope...");
  const engine = new LocationEngine(new MockLocationProvider());
  const event: LocationEvent = engine.createLocationEvent("device-alpha-1", {
    latitude: 28.6139,
    longitude: 77.209,
    accuracy: 12,
    speed: 5.5,
    heading: 180,
    timestamp: "2026-08-18T10:00:00.000Z",
    source: "iot-sensor",
    metadata: { batteryLevel: 88, firmware: "v2.1" },
  });

  assert(event.entityId === "device-alpha-1", "EntityId must be assigned correctly");
  assert(event.location.latitude === 28.6139, "Event latitude must match input");
  assert(event.qualityState === "VALID" || event.qualityState === "STALE", "Quality state must be evaluated");
  assert(event.metadata.batteryLevel === 88, "Metadata must be preserved");

  // 15. Location State Transitions
  console.log("  [9/21] Testing Location State Transitions...");
  const currentState = engine.getState();
  assert(currentState === "available" || currentState === "acquiring", "State must start as available/acquiring");

  // 16. Location Error Normalization
  console.log("  [10/21] Testing Location Error Normalization...");
  const err = new LocationError("PERMISSION_DENIED", "User rejected GPS access");
  assert(err.code === "PERMISSION_DENIED", "LocationError code must be PERMISSION_DENIED");
  assert(err.name === "LocationError", "Error name must be LocationError");

  // 17. Permission State Abstraction
  console.log("  [11/21] Testing Permission State Contracts...");
  const mockWebAdapter = new WebLocationAdapter();
  assert(typeof mockWebAdapter.isAvailable === "boolean", "WebLocationAdapter.isAvailable must return boolean");

  // 18. Location Stream Lifecycle (Subscribe / Unsubscribe / Start / Stop)
  console.log("  [12/21] Testing Location Stream Subscription Lifecycle...");
  const mockProvider = new MockLocationProvider();
  mockProvider.setMockLocation({
    latitude: 28.6139,
    longitude: 77.209,
    timestamp: new Date().toISOString(),
    source: "mock-provider",
  });
  const streamEngine = new LocationEngine(mockProvider, { updateIntervalMs: 50 });

  let receivedCount = 0;
  const sub = streamEngine.subscribe((evt) => {
    receivedCount++;
  });

  streamEngine.start("entity-stream-test");
  assert(sub.id.startsWith("sub-"), "Subscription ID must be generated");

  mockProvider.triggerTick();
  mockProvider.triggerTick();

  streamEngine.stop();
  sub.unsubscribe();

  assert(receivedCount === 2, `Stream listener should receive 2 triggered events (received ${receivedCount})`);

  // 19. Sampling Configuration
  console.log("  [13/21] Testing Sampling Configuration...");
  engine.setSamplingOptions({ updateIntervalMs: 10000, desiredAccuracyMeters: 25 });
  const opts = engine.getSamplingOptions();
  assert(opts.updateIntervalMs === 10000, "Update interval must update to 10000ms");
  assert(opts.desiredAccuracyMeters === 25, "Desired accuracy must update to 25m");

  // 20. Stale Location Quality Detection
  console.log("  [14/21] Testing Stale Location Quality Assessment...");
  const oldLoc: Location = {
    latitude: 28.6139,
    longitude: 77.209,
    timestamp: "2020-01-01T00:00:00.000Z",
  };
  const quality = LocationValidator.evaluateQuality(oldLoc, { maxAgeMs: 60000 }, Date.now());
  assert(quality === "STALE", "Old location timestamp must yield STALE quality state");

  // 21. Metadata Preservation
  console.log("  [15/21] Testing Location Metadata Preservation...");
  const metaLoc: Location = {
    latitude: 18.52,
    longitude: 73.85,
    timestamp: Date.now(),
    metadata: { sensorType: "BLE", rssi: -65 },
  };
  const metaEvt = engine.createLocationEvent("sensor-99", metaLoc);
  assert(metaEvt.metadata.sensorType === "BLE", "Sensor metadata must be preserved");
  assert(metaEvt.metadata.rssi === -65, "RSSI metadata must be preserved");

  console.log("✅ Location Engine Pure Domain & Validation Unit Tests Passed Successfully!");
}
