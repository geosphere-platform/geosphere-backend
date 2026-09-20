/**
 * GeoSphere Platform — Edit Policy & Validation Engine
 *
 * Provides business-agnostic, policy-driven GIS editing rules for Web + Android + iOS.
 * Includes Layer Edit Policies, Geometry Policies, Topology Policies, Operation Matrices,
 * Jurisdiction Boundary Guards, and Edit Session state management.
 */

import { GeoSphereGeometry, GeoSphereFeature, Coordinate } from "./geospatial-editing-engine";

export type OperationType =
  | "MOVE"
  | "EDIT_PROPERTIES"
  | "DELETE"
  | "VERTEX_EDIT"
  | "ADD_VERTEX"
  | "REMOVE_VERTEX"
  | "REVERSE"
  | "MERGE"
  | "SPLIT"
  | "BUFFER"
  | "SIMPLIFY";

export type OverlapPolicy = "ALLOW" | "WARN" | "BLOCK";

export interface GeoSphereLayerEditPolicy {
  layerId: string;
  editable: boolean;
  readOnly: boolean;
  createAllowed: boolean;
  deleteAllowed: boolean;
  mergeAllowed: boolean;
  splitAllowed: boolean;
  bufferAllowed: boolean;
  allowedGeometryTypes: Array<GeoSphereGeometry["type"]>;
  requiredAttributes: string[];
}

export interface GeoSphereGeometryPolicy {
  minVertices?: number;
  maxVertices?: number;
  minAreaSqMeters?: number;
  maxAreaSqMeters?: number;
  minLineLengthMeters?: number;
  maxLineLengthMeters?: number;
  maxMoveDistanceKm?: number;
}

export interface GeoSphereTopologyPolicy {
  overlapPolicy: OverlapPolicy;
  preventGaps: boolean;
  preventSelfIntersection: boolean;
  preventDuplicateGeometry: boolean;
}

export interface GeoSphereJurisdictionPolicy {
  jurisdictionId?: string;
  jurisdictionName?: string;
  boundaryPolygon?: Coordinate[];
  enforceStrictBoundary: boolean;
}

export interface GeoSphereEditSession {
  sessionId: string;
  feature: GeoSphereFeature;
  originalGeometry: GeoSphereGeometry;
  previewGeometry: GeoSphereGeometry | null;
  layerPolicy: GeoSphereLayerEditPolicy;
  geometryPolicy: GeoSphereGeometryPolicy;
  topologyPolicy: GeoSphereTopologyPolicy;
  jurisdictionPolicy: GeoSphereJurisdictionPolicy;
  isLocked: boolean;
  lockReason?: string;
  hasUnsavedChanges: boolean;
}

/**
 * Default Business-Agnostic Layer Policy Generator
 */
export function createDefaultLayerPolicy(layerId: string = "default_layer"): GeoSphereLayerEditPolicy {
  return {
    layerId,
    editable: true,
    readOnly: false,
    createAllowed: true,
    deleteAllowed: true,
    mergeAllowed: true,
    splitAllowed: true,
    bufferAllowed: true,
    allowedGeometryTypes: [
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
      "Polygon",
      "MultiPolygon",
      "Circle",
      "Rectangle",
    ],
    requiredAttributes: ["name", "status"],
  };
}

/**
 * Default Geometry Constraints Policy
 */
export function createDefaultGeometryPolicy(): GeoSphereGeometryPolicy {
  return {
    minVertices: 1,
    maxVertices: 1000,
    minAreaSqMeters: 0.1,
    maxAreaSqMeters: 100000000, // 100 km²
    minLineLengthMeters: 0.1,
    maxLineLengthMeters: 500000, // 500 km
    maxMoveDistanceKm: 50,
  };
}

/**
 * Operation Matrix Evaluator
 * Enforces allowed/disallowed operations per geometry type
 */
export class GeoSphereOperationMatrix {
  public static getAllowedOperations(geometryType: GeoSphereGeometry["type"]): OperationType[] {
    switch (geometryType) {
      case "Point":
        return ["MOVE", "EDIT_PROPERTIES", "DELETE"];
      case "LineString":
      case "MultiLineString":
        return [
          "MOVE",
          "EDIT_PROPERTIES",
          "DELETE",
          "VERTEX_EDIT",
          "ADD_VERTEX",
          "REMOVE_VERTEX",
          "REVERSE",
          "SIMPLIFY",
          "SPLIT",
          "BUFFER",
        ];
      case "Polygon":
      case "Circle":
      case "Rectangle":
        return [
          "MOVE",
          "EDIT_PROPERTIES",
          "DELETE",
          "VERTEX_EDIT",
          "ADD_VERTEX",
          "REMOVE_VERTEX",
          "MERGE",
          "SPLIT",
          "BUFFER",
          "SIMPLIFY",
        ];
      case "MultiPolygon":
        return [
          "MOVE",
          "EDIT_PROPERTIES",
          "DELETE",
          "VERTEX_EDIT",
          "MERGE",
          "SPLIT",
          "BUFFER",
          "SIMPLIFY",
        ];
      default:
        return ["MOVE", "EDIT_PROPERTIES", "DELETE"];
    }
  }

  public static isOperationAllowed(
    geometryType: GeoSphereGeometry["type"],
    operation: OperationType,
    layerPolicy?: GeoSphereLayerEditPolicy
  ): { allowed: boolean; reason?: string } {
    const matrixAllowed = this.getAllowedOperations(geometryType).includes(operation);
    if (!matrixAllowed) {
      return {
        allowed: false,
        reason: `Operation '${operation}' is not supported for geometry type '${geometryType}'.`,
      };
    }

    if (layerPolicy) {
      if (!layerPolicy.editable) {
        return { allowed: false, reason: "Layer is marked read-only or not editable." };
      }
      if (operation === "DELETE" && !layerPolicy.deleteAllowed) {
        return { allowed: false, reason: "Delete operation is disabled on this layer." };
      }
      if (operation === "MERGE" && !layerPolicy.mergeAllowed) {
        return { allowed: false, reason: "Merge operation is disabled on this layer." };
      }
      if (operation === "SPLIT" && !layerPolicy.splitAllowed) {
        return { allowed: false, reason: "Split operation is disabled on this layer." };
      }
      if (operation === "BUFFER" && !layerPolicy.bufferAllowed) {
        return { allowed: false, reason: "Buffer operation is disabled on this layer." };
      }
    }

    return { allowed: true };
  }
}

/**
 * Jurisdiction Boundary Checker
 * Validates whether all coordinates in a geometry remain inside an assigned jurisdiction boundary.
 */
export class GeoSphereJurisdictionGuard {
  public static isPointInPolygon(point: Coordinate, polygon: Coordinate[]): boolean {
    if (!polygon || polygon.length < 3) return true;
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  public static validateJurisdiction(
    geometry: GeoSphereGeometry,
    jurisdictionPolicy?: GeoSphereJurisdictionPolicy
  ): { valid: boolean; errorMessage?: string } {
    if (!jurisdictionPolicy || !jurisdictionPolicy.enforceStrictBoundary || !jurisdictionPolicy.boundaryPolygon) {
      return { valid: true };
    }

    const poly = jurisdictionPolicy.boundaryPolygon;
    const extractCoordinates = (coords: any): Coordinate[] => {
      if (!Array.isArray(coords) || coords.length === 0) return [];
      if (typeof coords[0] === "number") return [coords as Coordinate];
      return coords.flatMap(extractCoordinates);
    };

    const allCoords = extractCoordinates(geometry.coordinates);
    for (const pt of allCoords) {
      if (typeof pt[0] === "number" && typeof pt[1] === "number") {
        if (!this.isPointInPolygon(pt, poly)) {
          return {
            valid: false,
            errorMessage: `Feature cannot be moved outside your assigned jurisdiction (${jurisdictionPolicy.jurisdictionName || "Assigned District"}).`,
          };
        }
      }
    }

    return { valid: true };
  }
}
