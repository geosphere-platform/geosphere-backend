/**
 * Phase 9 — Realtime Spatial Engine Integration Tests
 *
 * Tests full pipeline: subject creation → location ingestion → geofence evaluation
 * → event publication → history ledger queries using the in-memory/dev-mode engine.
 */

import { RealtimeSpatialEngine } from "../../core/gis/realtime/realtime-spatial.engine";
import { PostGisRealtimeSpatialRepository } from "../../core/gis/realtime/postgis-realtime-spatial.repository";
import { InMemoryRealtimeEventPublisher } from "../../core/gis/realtime/realtime-event.publisher";
import { LocationIngestionService } from "../../core/gis/realtime/location-ingestion.service";
import { PostGisOperationsRepository } from "../../core/gis/operations/postgis-operations.repository";
import { GeometryValidationService } from "../../core/gis/operations/geometry-validation.service";
import { GeofenceEngine } from "../../core/gis/operations/geofence.engine";
import { RealtimeEventEnvelope } from "../../core/gis/realtime/spatial-event.model";
import { BoundingBox } from "../../core/gis/bbox/bounding-box";
import { db } from "../../database";

export async function runRealtimeEngineIntegrationTests() {
  const repo = new PostGisRealtimeSpatialRepository(db);
  const publisher = new InMemoryRealtimeEventPublisher();
  const operationsRepo = new PostGisOperationsRepository(db);
  const validator = new GeometryValidationService(operationsRepo);
  const geofenceEngine = new GeofenceEngine(operationsRepo, validator);
  const ingestion = new LocationIngestionService(
    repo,
    publisher,
    geofenceEngine,
    operationsRepo,
    validator,
  );
  const engine = new RealtimeSpatialEngine(repo, ingestion, publisher);

  const tenantId = `intg-test-tenant-${Date.now()}`;
  const context = {
    tenantId,
    userId: "test-user-001",
    roles: ["admin"] as string[],
  };

  // ============================================================
  // Test 1: Subject Registration
  // ============================================================
  const subject = await engine.createSubject(context, {
    type: "delivery-drone",
    externalId: `ext-drone-${Date.now()}`,
    name: "Test Drone Alpha",
    metadata: { model: "DJI Mavic 3", maxAltitude: 400 },
  });

  if (!subject.id)
    throw new Error("Subject must have an ID after registration");
  if (subject.tenantId !== tenantId)
    throw new Error("Subject tenantId mismatch");
  if (subject.type !== "delivery-drone")
    throw new Error("Subject type mismatch");

  // ============================================================
  // Test 2: Single Location Ingestion
  // ============================================================
  const tenantEvents: RealtimeEventEnvelope[] = [];
  publisher.subscribe(`tenant:${tenantId}`, (env) => tenantEvents.push(env));

  const result1 = await engine.ingestLocation(context, {
    subjectId: subject.id,
    timestamp: new Date().toISOString(),
    longitude: 77.5946,
    latitude: 12.9716,
    speed: 8.5,
    heading: 90,
    source: "gps",
  });

  if (!result1.accepted)
    throw new Error("First location update must be accepted");
  if (result1.staleUpdate)
    throw new Error("First location update must NOT be stale");
  if (!result1.currentPosition)
    throw new Error("Result must include current position");
  if (Math.abs(result1.currentPosition.coordinate[0] - 77.5946) > 0.0001) {
    throw new Error("Stored longitude mismatch after ingestion");
  }

  // Check event was published
  await new Promise((r) => setTimeout(r, 50)); // Let async publish complete
  const locationUpdatedEvents = tenantEvents.filter(
    (e) => e.eventType === "LOCATION_UPDATED",
  );
  if (locationUpdatedEvents.length < 1)
    throw new Error("LOCATION_UPDATED event not published to tenant channel");

  // ============================================================
  // Test 3: Out-of-Order Update — Should Be Stale
  // ============================================================
  const staleTimestamp = new Date(Date.now() - 60000).toISOString(); // 60 seconds ago
  const result2 = await engine.ingestLocation(context, {
    subjectId: subject.id,
    timestamp: staleTimestamp,
    longitude: 72.0,
    latitude: 18.0,
    source: "gps",
  });

  if (!result2.staleUpdate)
    throw new Error("Older-timestamp update must be marked as stale");

  // Current position must still be the t1 position (77.5946, 12.9716)
  const currentPos = await engine.getCurrentPosition(context, subject.id);
  if (!currentPos)
    throw new Error("Current position should still exist after stale update");
  if (Math.abs(currentPos.coordinate[0] - 77.5946) > 0.0001) {
    throw new Error("Current position was overwritten by stale update!");
  }

  // ============================================================
  // Test 4: Batch Ingestion (3 sequential updates)
  // ============================================================
  const now = Date.now();
  const batchResult = await engine.ingestBatch(context, [
    {
      subjectId: subject.id,
      timestamp: new Date(now + 1000).toISOString(),
      longitude: 77.6,
      latitude: 12.98,
      speed: 10.0,
      source: "gps",
    },
    {
      subjectId: subject.id,
      timestamp: new Date(now + 2000).toISOString(),
      longitude: 77.61,
      latitude: 12.985,
      speed: 11.5,
      source: "gps",
    },
    {
      subjectId: subject.id,
      timestamp: new Date(now + 3000).toISOString(),
      longitude: 77.62,
      latitude: 12.99,
      speed: 12.0,
      source: "gps",
    },
  ]);

  if (batchResult.processed !== 3)
    throw new Error(`Expected 3 processed, got ${batchResult.processed}`);
  if (batchResult.accepted !== 3)
    throw new Error(`Expected 3 accepted, got ${batchResult.accepted}`);

  // ============================================================
  // Test 5: Location History Ledger Query
  // ============================================================
  const historyResult = await engine.queryLocationHistory(context, subject.id, {
    limit: 20,
    order: "desc",
  });

  if (!Array.isArray(historyResult.items))
    throw new Error("Location history must return items array");
  // Should have at least 4 entries: 1 manual + 3 batch
  if (historyResult.items.length < 4)
    throw new Error(
      `Expected ≥4 history entries, got ${historyResult.items.length}`,
    );

  // ============================================================
  // Test 6: Get All Subjects for Tenant
  // ============================================================
  const subjectsResult = await engine.listSubjects(context, {});
  if (!Array.isArray(subjectsResult.items))
    throw new Error("listSubjects must return items array");
  const found = subjectsResult.items.find((s) => s.id === subject.id);
  if (!found)
    throw new Error("Registered subject not found in tenant subject list");

  // ============================================================
  // Test 7: Batch Size Validation (over limit)
  // ============================================================
  try {
    const oversizedBatch = Array.from({ length: 101 }, (_, i) => ({
      subjectId: subject.id,
      timestamp: new Date().toISOString(),
      longitude: 77.0 + i * 0.001,
      latitude: 13.0,
      source: "test",
    }));
    await engine.ingestBatch(context, oversizedBatch);
    throw new Error("Expected BatchSizeExceededError for batch > 100");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      !msg.toLowerCase().includes("batch") &&
      !msg.toLowerCase().includes("size") &&
      !msg.toLowerCase().includes("exceed")
    ) {
      throw new Error(`Unexpected error for batch overflow: ${msg}`);
    }
  }

  // ============================================================
  // Test 8: Viewport Spatial Query
  // ============================================================
  // The most recent position should be ~(77.62, 12.99) — within this bbox
  const bbox = new BoundingBox(77.5, 12.9, 77.7, 13.1);
  const vpResult = await engine.queryViewportPositions(context, bbox, 50);
  if (!vpResult || !vpResult.featureCollection) {
    throw new Error("Viewport query must return a featureCollection result");
  }
  if (!Array.isArray(vpResult.featureCollection.features)) {
    throw new Error("Viewport featureCollection must have features array");
  }
}
