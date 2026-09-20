/**
 * Pure Framework-Independent Geofencing Engine Unit Tests
 *
 * Verifies Circle & Polygon evaluation, state transitions (ENTER, EXIT, DWELL_START, DWELL_END),
 * duplicate event prevention, multiple geofences, multiple generic trackable entities,
 * and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { LocationEngine } from "../../core/gis/location/engine/location-engine";
import { MockLocationProvider } from "../../core/gis/location/provider/mock-location-provider";
import { GeofencingEngine } from "../../core/gis/geofencing/engine/geofence-engine";
import { Geofence, GeofenceEvent } from "../../core/gis/geofencing/types/geofence.types";
import { InMemoryGeofenceRepository } from "../../core/gis/geofencing/repository/geofence-repository.interface";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runGeofencingEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC GEOFENCING ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const repo = new InMemoryGeofenceRepository();
  const geofenceEngine = new GeofencingEngine(repo);
  const locationEngine = new LocationEngine(new MockLocationProvider());

  const t0 = 1700000000000;

  // Define Geofence 1: Circle Geofence (Radius 500m centered at [77.2090, 28.6139] Delhi)
  const circleGeofence: Geofence = {
    id: "gf-circle-1",
    name: "Delhi Depot Boundary",
    enabled: true,
    geometry: {
      type: "circle",
      center: [77.2090, 28.6139],
      radiusMeters: 500,
    },
    options: {
      dwellConfig: {
        enabled: true,
        dwellDurationSeconds: 10, // 10 seconds continuous dwell to trigger DWELL_START
      },
    },
  };

  // Define Geofence 2: Polygon Geofence
  const polygonGeofence: Geofence = {
    id: "gf-poly-2",
    name: "Tech Park Restricted Zone",
    enabled: true,
    geometry: {
      type: "polygon",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.200, 28.610],
            [77.220, 28.610],
            [77.220, 28.630],
            [77.200, 28.630],
            [77.200, 28.610],
          ],
        ],
      },
    },
  };

  await repo.addGeofence(circleGeofence);
  await repo.addGeofence(polygonGeofence);

  // 1. Initial State Check
  console.log("  [1/12] Testing Initial Geofence State...");
  assert(geofenceEngine.getEntityState("entity-001", "gf-circle-1") === "UNKNOWN", "Initial state must be UNKNOWN");

  // 2. Subject OUTSIDE Geofences
  console.log("  [2/12] Testing Subject Outside Geofence...");
  const evtOutside = locationEngine.createLocationEvent("entity-001", {
    latitude: 28.7000,
    longitude: 77.3000, // Far away outside
    timestamp: t0,
  });

  const events1 = await geofenceEngine.processLocationEvent(evtOutside);
  assert(events1.length === 0, "No events should trigger when subject is far outside");

  // 3. Subject Enters Circle Geofence (ENTER)
  console.log("  [3/12] Testing Subject Enters Circle Geofence (ENTER)...");
  const evtInsideCircle = locationEngine.createLocationEvent("entity-001", {
    latitude: 28.6139,
    longitude: 77.2090, // Exactly at center of circle
    timestamp: t0 + 1000,
  });

  // Track captured events via listener
  const capturedEvents: GeofenceEvent[] = [];
  const unsubscribe = geofenceEngine.subscribeEvents((evt) => capturedEvents.push(evt));

  await geofenceEngine.processLocationEvent(evtInsideCircle);
  assert(capturedEvents.length > 0, "Events must be captured by subscriber");
  
  const enterCircleEvent = capturedEvents.find((e) => e.geofenceId === "gf-circle-1" && e.eventType === "ENTER");
  assert(enterCircleEvent !== undefined, "ENTER event must be generated for Circle geofence");
  assert(enterCircleEvent?.subjectId === "entity-001", "Event subjectId must match entityId");
  assert(geofenceEngine.getEntityState("entity-001", "gf-circle-1") === "INSIDE", "State must transition to INSIDE");

  // 4. Duplicate ENTER Prevention
  console.log("  [4/12] Testing Duplicate ENTER Prevention...");
  capturedEvents.length = 0;
  const evtInsideCircle2 = locationEngine.createLocationEvent("entity-001", {
    latitude: 28.6140,
    longitude: 77.2091, // Still inside
    timestamp: t0 + 5000,
  });

  await geofenceEngine.processLocationEvent(evtInsideCircle2);
  const duplicateEnter = capturedEvents.find((e) => e.eventType === "ENTER");
  assert(duplicateEnter === undefined, "Duplicate ENTER event must NOT be generated while subject remains INSIDE");

  // 5. Dwell Start Triggering (DWELL_START)
  console.log("  [5/12] Testing Dwell Start Triggering (DWELL_START)...");
  capturedEvents.length = 0;
  const evtInsideDwell = locationEngine.createLocationEvent("entity-001", {
    latitude: 28.6140,
    longitude: 77.2091,
    timestamp: t0 + 15000, // 14 seconds elapsed since entry (> 10s dwell threshold)
  });

  await geofenceEngine.processLocationEvent(evtInsideDwell);
  const dwellStartEvent = capturedEvents.find((e) => e.eventType === "DWELL_START");
  assert(dwellStartEvent !== undefined, "DWELL_START event must trigger when continuous dwell exceeds threshold");
  assert(dwellStartEvent?.dwellDurationSeconds !== undefined && dwellStartEvent.dwellDurationSeconds >= 10, "Dwell duration must be recorded");

  // 6. Subject Exits Circle Geofence (DWELL_END & EXIT)
  console.log("  [6/12] Testing Subject Exits Geofence (DWELL_END & EXIT)...");
  capturedEvents.length = 0;
  const evtExitCircle = locationEngine.createLocationEvent("entity-001", {
    latitude: 28.7000,
    longitude: 77.3000, // Outside circle and polygon
    timestamp: t0 + 25000,
  });

  await geofenceEngine.processLocationEvent(evtExitCircle);
  const dwellEndEvent = capturedEvents.find((e) => e.eventType === "DWELL_END");
  const exitEvent = capturedEvents.find((e) => e.eventType === "EXIT");
  assert(dwellEndEvent !== undefined, "DWELL_END event must trigger prior to exit if dwelling was active");
  assert(exitEvent !== undefined, "EXIT event must trigger when moving outside boundary");
  assert(geofenceEngine.getEntityState("entity-001", "gf-circle-1") === "OUTSIDE", "State must transition to OUTSIDE");

  // 7. Duplicate EXIT Prevention
  console.log("  [7/12] Testing Duplicate EXIT Prevention...");
  capturedEvents.length = 0;
  const evtStillOutside = locationEngine.createLocationEvent("entity-001", {
    latitude: 28.7100,
    longitude: 77.3100,
    timestamp: t0 + 30000,
  });

  await geofenceEngine.processLocationEvent(evtStillOutside);
  assert(capturedEvents.length === 0, "No events should trigger while subject remains OUTSIDE");

  // 8. Polygon Geofence Evaluation
  console.log("  [8/12] Testing Polygon Geofence Evaluation...");
  capturedEvents.length = 0;
  const evtInsidePoly = locationEngine.createLocationEvent("entity-002", {
    latitude: 28.6200,
    longitude: 77.2100, // Inside Polygon Geofence
    timestamp: t0 + 35000,
  });

  await geofenceEngine.processLocationEvent(evtInsidePoly);
  const polyEnter = capturedEvents.find((e) => e.geofenceId === "gf-poly-2" && e.eventType === "ENTER");
  assert(polyEnter !== undefined, "ENTER event must be generated for Polygon geofence");

  // 9. Overlapping Geofences Evaluation
  console.log("  [9/12] Testing Overlapping Geofence Evaluation...");
  capturedEvents.length = 0;
  const evtOverlap = locationEngine.createLocationEvent("entity-003", {
    latitude: 28.6139,
    longitude: 77.2090, // Position inside BOTH circle and polygon
    timestamp: t0 + 40000,
  });

  await geofenceEngine.processLocationEvent(evtOverlap);
  const circleEnter = capturedEvents.find((e) => e.geofenceId === "gf-circle-1" && e.eventType === "ENTER");
  const polyEnter2 = capturedEvents.find((e) => e.geofenceId === "gf-poly-2" && e.eventType === "ENTER");
  assert(circleEnter !== undefined && polyEnter2 !== undefined, "Both overlapping geofences must generate independent ENTER events");

  // 10. Multiple Generic Trackable Entity Support
  console.log("  [10/12] Testing Multiple Generic Trackable Entities...");
  assert(geofenceEngine.getEntityState("entity-001", "gf-circle-1") === "OUTSIDE", "entity-001 must be OUTSIDE");
  assert(geofenceEngine.getEntityState("entity-003", "gf-circle-1") === "INSIDE", "entity-003 must be INSIDE");

  // 11. Subscription Cleanup
  console.log("  [11/12] Testing Event Subscription Cleanup...");
  unsubscribe();
  capturedEvents.length = 0;
  const evtTestUnsub = locationEngine.createLocationEvent("entity-004", {
    latitude: 28.6139,
    longitude: 77.2090,
    timestamp: t0 + 45000,
  });

  await geofenceEngine.processLocationEvent(evtTestUnsub);
  assert(capturedEvents.length === 0, "Unsubscribed listener must NOT receive events");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof geofenceEngine.processLocationEvent === "function", "GeofencingEngine must expose processLocationEvent");
  assert(typeof repo.listActiveGeofences === "function", "IGeofenceRepository contract must be satisfied");

  console.log("✅ Generic Geofencing Engine Pure Domain Unit Tests Passed Successfully!");
}
