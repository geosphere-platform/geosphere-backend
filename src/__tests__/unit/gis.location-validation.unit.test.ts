/**
 * Phase 9 — Location Validation & Normalization Unit Tests
 */

import { LocationIngestionService } from "../../core/gis/realtime/location-ingestion.service";
import { PostGisRealtimeSpatialRepository } from "../../core/gis/realtime/postgis-realtime-spatial.repository";
import { InMemoryRealtimeEventPublisher } from "../../core/gis/realtime/realtime-event.publisher";
import { PostGisOperationsRepository } from "../../core/gis/operations/postgis-operations.repository";
import { GeometryValidationService } from "../../core/gis/operations/geometry-validation.service";
import { GeofenceEngine } from "../../core/gis/operations/geofence.engine";
import {
  InvalidLocationError,
  InvalidTimestampError,
  InvalidCoordinateError,
} from "../../core/errors/spatial-errors";
import { db } from "../../database";

export function runLocationValidationUnitTests() {
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

  // Test 1: Valid Location Update Normalization
  const validPayload = {
    subjectId: "subj-101",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    longitude: 73.8567,
    latitude: 18.5204,
    speed: 15.678,
    heading: 400, // Should normalize 400 -> 40 deg
    accuracy: 4.256,
    source: "GPS",
  };

  const normalized = ingestion.normalizeLocationUpdate(
    "tenant-001",
    validPayload,
  );
  if (normalized.subjectId !== "subj-101")
    throw new Error("Expected subjectId 'subj-101'");
  if (
    normalized.coordinate[0] !== 73.8567 ||
    normalized.coordinate[1] !== 18.5204
  ) {
    throw new Error("Coordinate normalization mismatch");
  }
  if (normalized.heading !== 40)
    throw new Error(
      `Expected normalized heading 40°, got ${normalized.heading}°`,
    );
  if (normalized.speed !== 15.68)
    throw new Error(`Expected speed rounded to 15.68, got ${normalized.speed}`);

  // Test 2: Invalid Longitude Out-of-Bounds Rejection
  try {
    ingestion.normalizeLocationUpdate("tenant-001", {
      subjectId: "subj-101",
      timestamp: Date.now(),
      longitude: 200, // Out of bounds > 180
      latitude: 18.5204,
    });
    throw new Error("Expected InvalidCoordinateError for longitude 200");
  } catch (err) {
    if (!(err instanceof InvalidCoordinateError)) throw err;
  }

  // Test 3: Invalid Future Timestamp Rejection (Beyond 15 min clock skew)
  try {
    const futureTime = Date.now() + 60 * 60 * 1000; // 1 hour in future
    ingestion.normalizeLocationUpdate("tenant-001", {
      subjectId: "subj-101",
      timestamp: futureTime,
      longitude: 73.8567,
      latitude: 18.5204,
    });
    throw new Error("Expected InvalidTimestampError for future timestamp");
  } catch (err) {
    if (!(err instanceof InvalidTimestampError)) throw err;
  }

  // Test 4: Missing subjectId Rejection
  try {
    ingestion.normalizeLocationUpdate("tenant-001", {
      subjectId: "",
      timestamp: Date.now(),
      longitude: 73.8567,
      latitude: 18.5204,
    });
    throw new Error("Expected InvalidLocationError for missing subjectId");
  } catch (err) {
    if (!(err instanceof InvalidLocationError)) throw err;
  }
}
