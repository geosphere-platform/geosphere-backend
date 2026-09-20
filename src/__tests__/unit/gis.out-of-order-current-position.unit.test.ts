/**
 * Phase 9 — Out-of-Order Current Position Suppression Unit Tests
 *
 * Validates that atomic position upsert correctly prevents stale/out-of-order
 * updates from overwriting newer position state.
 */

import { PostGisRealtimeSpatialRepository } from "../../core/gis/realtime/postgis-realtime-spatial.repository";
import { NormalizedLocationUpdate } from "../../core/gis/realtime/location-update.model";
import { db } from "../../database";

function makeUpdate(
  subjectId: string,
  tenantId: string,
  timestampMs: number,
  lon: number,
  lat: number,
): NormalizedLocationUpdate {
  return {
    subjectId,
    tenantId,
    coordinate: [lon, lat],
    location: { type: "Point", coordinates: [lon, lat] },
    timestamp: new Date(timestampMs).toISOString(),
    timestampMs,
    accuracy: null,
    altitude: null,
    speed: null,
    heading: null,
    source: "unit-test",
    metadata: {},
  };
}

export async function runOutOfOrderCurrentPositionUnitTests() {
  const repo = new PostGisRealtimeSpatialRepository(db);

  const subjectId = `oop-test-subj-${Date.now()}`;
  const tenantId = "tenant-oop-test";
  const t1 = Date.now() - 5000; // 5 seconds ago (older)
  const t2 = Date.now() - 2000; // 2 seconds ago (newer)
  const t3 = Date.now() - 8000; // 8 seconds ago (oldest — should be suppressed)

  // Step 1: Ingest t2 (newer) first
  const update2 = makeUpdate(subjectId, tenantId, t2, 73.8567, 18.5204);
  const res2 = await repo.upsertCurrentPosition(update2);

  if (!res2.updated)
    throw new Error("Expected first upsert to succeed (updated=true)");
  if (res2.stale) throw new Error("Expected first upsert to NOT be stale");
  if (res2.position?.coordinate[0] !== 73.8567) {
    throw new Error(
      `Position mismatch after first upsert: ${res2.position?.coordinate[0]}`,
    );
  }

  // Step 2: Ingest t3 (oldest) — should be suppressed since t2 > t3
  const update3 = makeUpdate(subjectId, tenantId, t3, 72.0, 17.0);
  const res3 = await repo.upsertCurrentPosition(update3);

  if (res3.updated)
    throw new Error(
      "Expected out-of-order (older) update to NOT update position",
    );
  if (!res3.stale)
    throw new Error("Expected out-of-order update to be marked as stale");

  // Verify position is still t2's coords (73.8567, 18.5204), NOT t3's (72, 17)
  const current = await repo.getCurrentPosition(subjectId, tenantId);
  if (!current)
    throw new Error("Expected current position to exist after t2 upsert");
  if (Math.abs(current.coordinate[0] - 73.8567) > 0.0001) {
    throw new Error(
      `Position was incorrectly overwritten by stale update! coord[0]=${current.coordinate[0]}`,
    );
  }

  // Step 3: Ingest t1 (newer than t3, older than t2) — also should be suppressed
  const update1 = makeUpdate(subjectId, tenantId, t1, 74.0, 19.0);
  const res1 = await repo.upsertCurrentPosition(update1);

  if (res1.updated)
    throw new Error("Expected intermediate-age update to NOT update (t1 < t2)");

  // Step 4: Ingest a genuinely newer update — should succeed
  const tLatest = Date.now() + 500;
  const updateLatest = makeUpdate(subjectId, tenantId, tLatest, 77.5, 12.9716);
  const resLatest = await repo.upsertCurrentPosition(updateLatest);

  if (!resLatest.updated)
    throw new Error("Expected latest-timestamp update to succeed");
  if (resLatest.stale)
    throw new Error("Expected latest update to NOT be stale");

  const afterLatest = await repo.getCurrentPosition(subjectId, tenantId);
  if (!afterLatest)
    throw new Error("Expected current position to exist after latest upsert");
  if (Math.abs(afterLatest.coordinate[0] - 77.5) > 0.0001) {
    throw new Error(
      `Position not updated to latest coord! coord[0]=${afterLatest.coordinate[0]}`,
    );
  }
}
