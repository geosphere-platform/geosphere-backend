/**
 * Framework-Independent Geofence Evaluator Engine
 *
 * Evaluates geographic coordinates against Circle and Polygon geofence geometries
 * using canonical Core GIS spatial math (Haversine distance & ray-casting Point-in-Polygon).
 *
 * MUST NOT depend on OpenLayers, React, Next.js, or vehicle-specific tracking logic.
 */

import { Coordinate, PolygonGeometry, MultiPolygonGeometry } from "../../types/geometry";
import { calculateDistance, isPointInPolygon } from "../../utils/spatial-utils";
import { BoundingBox } from "../../bbox/bounding-box";
import { Geofence, GeofenceState, GeofenceEvaluationResult } from "../types/geofence.types";

export class GeofenceEvaluator {
  /**
   * Evaluate a single coordinate against a Geofence
   */
  evaluateCoordinate(
    coordinate: Coordinate,
    geofence: Geofence,
    subjectId: string = "generic-subject",
    evaluatedAt: string = new Date().toISOString(),
  ): GeofenceEvaluationResult {
    if (!geofence.enabled) {
      return {
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        subjectId,
        state: "OUTSIDE",
        evaluatedAt,
      };
    }

    const [lng, lat] = coordinate;
    const geometry = geofence.geometry;

    if (geometry.type === "circle") {
      return this.evaluateCircle(lng, lat, geometry.center, geometry.radiusMeters, geofence, subjectId, evaluatedAt);
    }

    if (geometry.type === "polygon") {
      const polyGeom = geometry.geometry;
      if (polyGeom.type === "Polygon") {
        return this.evaluatePolygon(lng, lat, polyGeom as PolygonGeometry, geofence, subjectId, evaluatedAt);
      }
      if (polyGeom.type === "MultiPolygon") {
        return this.evaluateMultiPolygon(lng, lat, polyGeom as MultiPolygonGeometry, geofence, subjectId, evaluatedAt);
      }
    }

    return {
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      subjectId,
      state: "OUTSIDE",
      evaluatedAt,
    };
  }

  private evaluateCircle(
    lng: number,
    lat: number,
    center: Coordinate,
    radiusMeters: number,
    geofence: Geofence,
    subjectId: string,
    evaluatedAt: string,
  ): GeofenceEvaluationResult {
    const distanceMeters = calculateDistance([lng, lat], center);
    const tolerance = geofence.options?.boundaryToleranceMeters ?? 0.5;

    let state: GeofenceState = "OUTSIDE";
    if (Math.abs(distanceMeters - radiusMeters) <= tolerance) {
      state = "BOUNDARY";
    } else if (distanceMeters <= radiusMeters) {
      state = "INSIDE";
    }

    return {
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      subjectId,
      state,
      distanceToBoundaryMeters: Math.max(0, distanceMeters - radiusMeters),
      evaluatedAt,
    };
  }

  private evaluatePolygon(
    lng: number,
    lat: number,
    polygon: PolygonGeometry,
    geofence: Geofence,
    subjectId: string,
    evaluatedAt: string,
  ): GeofenceEvaluationResult {
    const outerRing = polygon.coordinates[0];
    if (!outerRing || outerRing.length < 3) {
      return { geofenceId: geofence.id, geofenceName: geofence.name, subjectId, state: "OUTSIDE", evaluatedAt };
    }

    // Candidate filtering using BoundingBox
    const bbox = BoundingBox.fromCoordinates(outerRing);
    if (!bbox.containsCoordinate([lng, lat])) {
      return { geofenceId: geofence.id, geofenceName: geofence.name, subjectId, state: "OUTSIDE", evaluatedAt };
    }

    // Ray-casting point-in-polygon math
    const isInsideOuter = isPointInPolygon(lat, lng, outerRing);
    if (!isInsideOuter) {
      return { geofenceId: geofence.id, geofenceName: geofence.name, subjectId, state: "OUTSIDE", evaluatedAt };
    }

    // Check inner hole rings if present
    for (let i = 1; i < polygon.coordinates.length; i++) {
      const holeRing = polygon.coordinates[i];
      if (isPointInPolygon(lat, lng, holeRing)) {
        return { geofenceId: geofence.id, geofenceName: geofence.name, subjectId, state: "OUTSIDE", evaluatedAt };
      }
    }

    return {
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      subjectId,
      state: "INSIDE",
      evaluatedAt,
    };
  }

  private evaluateMultiPolygon(
    lng: number,
    lat: number,
    multiPolygon: MultiPolygonGeometry,
    geofence: Geofence,
    subjectId: string,
    evaluatedAt: string,
  ): GeofenceEvaluationResult {
    for (const polyCoords of multiPolygon.coordinates) {
      const polyGeom: PolygonGeometry = { type: "Polygon", coordinates: polyCoords };
      const res = this.evaluatePolygon(lng, lat, polyGeom, geofence, subjectId, evaluatedAt);
      if (res.state === "INSIDE" || res.state === "BOUNDARY") {
        return res;
      }
    }

    return { geofenceId: geofence.id, geofenceName: geofence.name, subjectId, state: "OUTSIDE", evaluatedAt };
  }
}
