/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import { GeoSphereTopologyValidator, GeoSphereGeometry } from "./geospatial-editing-engine";
import {
  GeoSphereOperationMatrix,
  GeoSphereJurisdictionGuard,
  createDefaultLayerPolicy,
  GeoSphereLayerEditPolicy,
  GeoSphereJurisdictionPolicy,
} from "./edit-policy-engine";

describe("GeoSphere Selection-First Edit Engine & Validation Rules", () => {
  it("Rule 1 & 2: Rejects empty, null, or NaN coordinates", () => {
    const invalidGeom: GeoSphereGeometry = {
      type: "Point",
      coordinates: [NaN, 21.1458],
    };
    const errors = GeoSphereTopologyValidator.validate(invalidGeom);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].code).toBe("INVALID_COORDINATES");
  });

  it("Rule 5 & 6: Rejects unclosed polygon outer rings", () => {
    const unclosedPoly: GeoSphereGeometry = {
      type: "Polygon",
      coordinates: [
        [
          [79.08, 21.14],
          [79.09, 21.15],
          [79.09, 21.14], // Unclosed! Does not return to [79.08, 21.14]
        ],
      ],
    };
    const errors = GeoSphereTopologyValidator.validate(unclosedPoly);
    expect(errors.some((e) => e.code === "UNCLOSED_POLYGON")).toBe(true);
  });

  it("Rule 8: Detects self-intersecting bow-tie polygons", () => {
    const bowTiePoly: GeoSphereGeometry = {
      type: "Polygon",
      coordinates: [
        [
          [79.08, 21.14],
          [79.09, 21.15],
          [79.08, 21.15],
          [79.09, 21.14], // Crosses itself!
          [79.08, 21.14],
        ],
      ],
    };
    const errors = GeoSphereTopologyValidator.validate(bowTiePoly);
    expect(errors.some((e) => e.code === "SELF_INTERSECTING_POLYGON")).toBe(true);
  });

  it("Operation Matrix: Enforces allowed operations per geometry type", () => {
    const pointOps = GeoSphereOperationMatrix.getAllowedOperations("Point");
    expect(pointOps).toContain("MOVE");
    expect(pointOps).not.toContain("SPLIT");
    expect(pointOps).not.toContain("MERGE");

    const polyOps = GeoSphereOperationMatrix.getAllowedOperations("Polygon");
    expect(polyOps).toContain("MERGE");
    expect(polyOps).toContain("SPLIT");
    expect(polyOps).toContain("BUFFER");

    const layerPolicy: GeoSphereLayerEditPolicy = {
      ...createDefaultLayerPolicy(),
      mergeAllowed: false,
    };

    const res = GeoSphereOperationMatrix.isOperationAllowed("Polygon", "MERGE", layerPolicy);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Merge operation is disabled");
  });

  it("Jurisdiction Guard: Blocks edits crossing assigned district boundary", () => {
    const districtBoundary = [
      [79.07, 21.13],
      [79.10, 21.13],
      [79.10, 21.17],
      [79.07, 21.17],
      [79.07, 21.13],
    ];

    const policy: GeoSphereJurisdictionPolicy = {
      jurisdictionId: "dist_nagpur",
      jurisdictionName: "Nagpur District",
      boundaryPolygon: districtBoundary,
      enforceStrictBoundary: true,
    };

    const validGeom: GeoSphereGeometry = {
      type: "Point",
      coordinates: [79.0882, 21.1458], // Inside district
    };
    expect(GeoSphereJurisdictionGuard.validateJurisdiction(validGeom, policy).valid).toBe(true);

    const invalidGeom: GeoSphereGeometry = {
      type: "Point",
      coordinates: [79.9999, 21.1458], // Outside district!
    };
    const res = GeoSphereJurisdictionGuard.validateJurisdiction(invalidGeom, policy);
    expect(res.valid).toBe(false);
    expect(res.errorMessage).toContain("Feature cannot be moved outside your assigned jurisdiction");
  });
});
