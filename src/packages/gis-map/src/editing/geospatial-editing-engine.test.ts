/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect } from "vitest";
import {
  GeoSphereGeometryEngine,
  GeoSphereTopologyValidator,
  GeoSphereEditHistory,
  GeoSphereFeature,
} from "./geospatial-editing-engine";

describe("GeoSphere Advanced Geospatial Editing Engine", () => {
  it("should calculate correct Centroid and BoundingBox for a Polygon", () => {
    const polygonFeature: GeoSphereFeature = {
      id: "poly-101",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.080, 21.140],
            [79.090, 21.140],
            [79.090, 21.150],
            [79.080, 21.150],
            [79.080, 21.140],
          ],
        ],
      },
      properties: { name: "Test Zone" },
      metadata: {
        createdAt: "2026-08-19T00:00:00Z",
        updatedAt: "2026-08-19T00:00:00Z",
        createdBy: "Tester",
        updatedBy: "Tester",
        version: 1,
      },
    };

    const centroid = GeoSphereGeometryEngine.centroid(polygonFeature.geometry);
    expect(centroid[0]).toBeCloseTo(79.084, 3);
    expect(centroid[1]).toBeCloseTo(21.144, 3);

    const bbox = GeoSphereGeometryEngine.boundingBox(polygonFeature.geometry);
    expect(bbox).toEqual([79.080, 21.140, 79.090, 21.150]);
  });

  it("should merge two polygons into a MultiPolygon feature", () => {
    const featA: GeoSphereFeature = {
      id: "poly-A",
      geometry: {
        type: "Polygon",
        coordinates: [[ [79.08, 21.14], [79.09, 21.14], [79.09, 21.15], [79.08, 21.14] ]],
      },
      properties: { zone: "A" },
      metadata: { createdAt: "", updatedAt: "", createdBy: "A", updatedBy: "A", version: 1 },
    };

    const featB: GeoSphereFeature = {
      id: "poly-B",
      geometry: {
        type: "Polygon",
        coordinates: [[ [79.09, 21.15], [79.10, 21.15], [79.10, 21.16], [79.09, 21.15] ]],
      },
      properties: { zone: "B" },
      metadata: { createdAt: "", updatedAt: "", createdBy: "B", updatedBy: "B", version: 1 },
    };

    const merged = GeoSphereGeometryEngine.merge(featA, featB);
    expect(merged.geometry.type).toBe("MultiPolygon");
    expect(merged.properties.zone).toBe("B");
    expect(merged.properties.mergedFrom).toEqual(["poly-A", "poly-B"]);
  });

  it("should validate topology for unclosed polygons", () => {
    const unclosedPolygon = {
      type: "Polygon" as const,
      coordinates: [
        [
          [79.080, 21.140],
          [79.090, 21.140],
          [79.090, 21.150],
          [79.080, 21.150], // Start [79.080, 21.140] != End [79.080, 21.150]
        ],
      ],
    };

    const errors = GeoSphereTopologyValidator.validate(unclosedPolygon);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("UNCLOSED_POLYGON");
  });

  it("should support local Undo and Redo editing history stack", () => {
    const history = new GeoSphereEditHistory();
    expect(history.canUndo()).toBe(false);

    history.pushRecord({
      operation: "CREATE",
      afterFeature: {
        id: "feat-1",
        geometry: { type: "Point", coordinates: [79.08, 21.14] },
        properties: { name: "Pin 1" },
        metadata: { createdAt: "", updatedAt: "", createdBy: "", updatedBy: "", version: 1 },
      },
    });

    expect(history.canUndo()).toBe(true);
    const undone = history.undo();
    expect(undone?.operation).toBe("CREATE");
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);

    const redone = history.redo();
    expect(redone?.operation).toBe("CREATE");
  });
});
