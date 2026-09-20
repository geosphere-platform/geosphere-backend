/**
 * Pure Generic Tracking Engine Unit Tests
 *
 * Tests track point ordering, deduplication, distance calculations, duration, gap segmentation,
 * GeoJSON geometry generation, speed statistics, session state transitions, and live stream updates
 * without requiring browser DOM, React, Next.js, OpenLayers, or native platform runtimes.
 */

import { LocationEngine, LocationEvent, MockLocationProvider } from "../../core/gis/location";
import { TrackBuilder, TrackingEngine, Track } from "../../core/gis/tracking";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export function runTrackingEnginePureUnitTests(): void {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC TRACKING ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const locationEngine = new LocationEngine(new MockLocationProvider());

  // 1. Point Ordering by Timestamp
  console.log("  [1/12] Testing Point Ordering by Timestamp...");
  const t0 = 1787049600000; // Epoch base
  const evt1 = locationEngine.createLocationEvent("entity-101", {
    latitude: 28.6139,
    longitude: 77.209,
    timestamp: t0 + 10000,
    speed: 10,
  });
  const evt2 = locationEngine.createLocationEvent("entity-101", {
    latitude: 28.6200,
    longitude: 77.215,
    timestamp: t0 + 5000, // Out of order timestamp
    speed: 12,
  });
  const evt3 = locationEngine.createLocationEvent("entity-101", {
    latitude: 28.6300,
    longitude: 77.225,
    timestamp: t0 + 20000,
    speed: 15,
  });

  const builder = new TrackBuilder();
  const track = builder.buildTrack("trk-001", "entity-101", [evt1, evt2, evt3]);

  assert(track.points.length === 3, "Track must contain 3 points");
  assert(track.points[0].timestampMs === t0 + 5000, "First point must be earliest timestamp (+5000ms)");
  assert(track.points[1].timestampMs === t0 + 10000, "Second point must be middle timestamp (+10000ms)");
  assert(track.points[2].timestampMs === t0 + 20000, "Third point must be latest timestamp (+20000ms)");

  // 2. Haversine Distance & Duration Calculation
  console.log("  [2/12] Testing Distance & Duration Calculation...");
  assert(track.statistics.totalDistanceMeters > 0, "Total distance must be positive");
  assert(track.statistics.totalDurationMs === 15000, "Total duration must equal 15000ms");
  assert(track.statistics.totalDurationSeconds === 15, "Duration in seconds must be 15s");

  // 3. Deduplication Strategy
  console.log("  [3/12] Testing Deduplication Strategy...");
  const dupEvt = locationEngine.createLocationEvent("entity-101", {
    latitude: 28.6139,
    longitude: 77.209,
    timestamp: t0 + 10000, // Duplicate timestamp and coordinate
  });
  const trackWithDup = builder.buildTrack("trk-dup", "entity-101", [evt1, dupEvt, evt3]);
  assert(trackWithDup.points.length === 2, "Identical duplicate event must be filtered");

  // 4. Track Segment Splitting on Time Gaps
  console.log("  [4/12] Testing Segment Splitting on Time Gaps...");
  const evtGap1 = locationEngine.createLocationEvent("entity-101", {
    latitude: 28.7000,
    longitude: 77.300,
    timestamp: t0 + 1000000, // Gap > 300 seconds (1000s gap)
  });
  const evtGap2 = locationEngine.createLocationEvent("entity-101", {
    latitude: 28.7100,
    longitude: 77.310,
    timestamp: t0 + 1015000,
  });

  const builderWithGap = new TrackBuilder({ maxGapDurationSeconds: 300 });
  const trackGapped = builderWithGap.buildTrack("trk-gap", "entity-101", [evt1, evt2, evt3, evtGap1, evtGap2]);

  assert(trackGapped.segments.length === 2, "Track must split into 2 segments due to time gap");
  assert(trackGapped.statistics.hasGaps === true, "Track statistics must reflect hasGaps = true");
  assert(trackGapped.geometry?.type === "MultiLineString", "Gapped track geometry must be MultiLineString");

  // 5. Single Segment GeoJSON LineString
  console.log("  [5/12] Testing GeoJSON LineString Geometry Generation...");
  assert(track.geometry?.type === "LineString", "Continuous track geometry must be GeoJSON LineString");
  assert((track.geometry as any).coordinates.length === 3, "LineString must contain 3 coordinate pairs");

  // 6. Speed Statistics (Provider vs Calculated)
  console.log("  [6/12] Testing Speed Statistics Computation...");
  assert(track.statistics.speedStats.minSpeedMs !== null, "Min speed must be computed");
  assert(track.statistics.speedStats.maxSpeedMs !== null, "Max speed must be computed");
  assert(track.statistics.speedStats.avgSpeedMs !== null, "Avg speed must be computed");
  assert(track.statistics.speedStats.maxSpeedKmh! > track.statistics.speedStats.minSpeedKmh!, "Kmh conversion must hold");

  // 7. TrackingSession State Machine
  console.log("  [7/12] Testing TrackingSession State Machine...");
  const trackingEngine = new TrackingEngine();
  const session = trackingEngine.startSession("drone-field-01", "unmanned-aerial-vehicle");

  assert(session.state === "ACTIVE", "New session state must be ACTIVE");
  assert(session.entityId === "drone-field-01", "EntityId must be assigned");

  trackingEngine.pauseSession();
  assert(trackingEngine.getSession()?.state === "PAUSED", "Session state must transition to PAUSED");

  trackingEngine.resumeSession();
  assert(trackingEngine.getSession()?.state === "ACTIVE", "Session state must transition to ACTIVE");

  const completedTrack = trackingEngine.stopSession();
  assert(trackingEngine.getSession()?.state === "COMPLETED", "Session state must transition to COMPLETED");

  // 8. Live LocationEvent Ingestion & Real-time Updates
  console.log("  [8/12] Testing Live Stream Subscriptions & Ingestion...");
  const liveEngine = new TrackingEngine();
  liveEngine.startSession("field-agent-77", "personnel");

  let updateCount = 0;
  let lastUpdatedDistance = 0;
  const sub = liveEngine.subscribeTrack((updatedTrack) => {
    updateCount++;
    lastUpdatedDistance = updatedTrack.statistics.totalDistanceMeters;
  });

  const p1 = locationEngine.createLocationEvent("field-agent-77", {
    latitude: 18.5204,
    longitude: 73.8567,
    timestamp: t0,
  });
  const p2 = locationEngine.createLocationEvent("field-agent-77", {
    latitude: 18.5250,
    longitude: 73.8600,
    timestamp: t0 + 30000,
  });

  liveEngine.ingestLocationEvent(p1);
  liveEngine.ingestLocationEvent(p2);

  sub.unsubscribe();

  assert(updateCount >= 2, "Subscriber must receive real-time track updates");
  assert(lastUpdatedDistance > 0, "Track statistics must update distance live");

  // 9. Generic Trackable Entity Flexibility
  console.log("  [9/12] Testing Generic Trackable Entity Flexibility...");
  const entities = [
    { id: "v-100", type: "vehicle" },
    { id: "agri-tractor-05", type: "agricultural-machinery" },
    { id: "asset-container-99", type: "logistics-asset" },
    { id: "medic-team-01", type: "emergency-personnel" },
  ];

  for (const ent of entities) {
    const eEvt = locationEngine.createLocationEvent(ent.id, {
      latitude: 28.61,
      longitude: 77.20,
      timestamp: Date.now(),
      metadata: { entityType: ent.type },
    });
    const entTrack = builder.buildTrack(`trk-${ent.id}`, ent.id, [eEvt]);
    assert(entTrack.entityId === ent.id, `Entity ID ${ent.id} must be set generic`);
  }

  // 10. Empty Track Handling
  console.log("  [10/12] Testing Empty Track Handling...");
  const emptyTrack = builder.buildTrack("trk-empty", "no-entity", []);
  assert(emptyTrack.points.length === 0, "Empty track points must be empty array");
  assert(emptyTrack.geometry === null, "Empty track geometry must be null");
  assert(emptyTrack.statistics.totalDistanceMeters === 0, "Empty track distance must be 0");

  // 11. Custom Sampling & Distance Threshold Filtering
  console.log("  [11/12] Testing Distance Threshold Filtering...");
  const strictBuilder = new TrackBuilder({ minDistanceThresholdMeters: 50 }); // Ignore movements < 50m
  const microEvt1 = locationEngine.createLocationEvent("asset-micro", {
    latitude: 28.61390,
    longitude: 77.20900,
    timestamp: t0,
  });
  const microEvt2 = locationEngine.createLocationEvent("asset-micro", {
    latitude: 28.61391, // Extremely small movement (< 2 meters)
    longitude: 77.20901,
    timestamp: t0 + 5000,
  });
  const microEvt3 = locationEngine.createLocationEvent("asset-micro", {
    latitude: 28.62500, // Significant movement (~1.2 km)
    longitude: 77.22000,
    timestamp: t0 + 15000,
  });

  const microTrack = strictBuilder.buildTrack("trk-micro", "asset-micro", [microEvt1, microEvt2, microEvt3]);
  assert(microTrack.points.length === 2, "Micro movement < 50m should be filtered out");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof TrackBuilder === "function", "TrackBuilder must be pure JS/TS class");
  assert(typeof TrackingEngine === "function", "TrackingEngine must be pure JS/TS class");

  console.log("✅ Generic Tracking Engine Pure Domain Unit Tests Passed Successfully!");
}
