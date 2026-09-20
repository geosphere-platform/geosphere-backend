/**
 * SpatialOperationService — Generic Spatial Operation & Relationship Engine
 *
 * Provides domain-level spatial relationship evaluations, buffer generation,
 * polygon operations (union, difference, symmetric difference, convex hull, clipping),
 * and line operations using database-backed PostGIS functions.
 */

import { Geometry, Coordinate } from "../types/geometry";
import {
  PostGisOperationsRepository,
  SpatialRelationType,
} from "./postgis-operations.repository";
import { GeometryValidationService } from "./geometry-validation.service";
import {
  SpatialMeasurementService,
  DistanceUnit,
} from "./spatial-measurement.service";
import {
  InvalidBufferError,
  SpatialOperationTooLargeError,
  InvalidGeometryError,
} from "../../errors/spatial-errors";
import { SPATIAL_OPERATION_LIMITS } from "../../config/spatial-limits";

export class SpatialOperationService {
  constructor(
    private readonly repository: PostGisOperationsRepository,
    private readonly validator: GeometryValidationService,
    private readonly measurementService: SpatialMeasurementService,
  ) {}

  /**
   * Evaluate generic spatial relation between two geometries
   */
  async spatialRelation(
    geomA: Geometry,
    geomB: Geometry,
    relation: SpatialRelationType,
  ): Promise<boolean> {
    const validA = this.validator.validateStructure(geomA);
    const validB = this.validator.validateStructure(geomB);
    return await this.repository.evaluateSpatialRelation(
      validA,
      validB,
      relation,
    );
  }

  /**
   * Check if point is inside polygon (ST_Within / ST_Contains / ST_Covers semantics)
   */
  async pointWithinPolygon(
    point: Geometry,
    polygon: Geometry,
  ): Promise<boolean> {
    if (point.type !== "Point") {
      throw new InvalidGeometryError(
        `pointWithinPolygon expects Point geometry, received '${point.type}'`,
      );
    }
    if (polygon.type !== "Polygon" && polygon.type !== "MultiPolygon") {
      throw new InvalidGeometryError(
        `pointWithinPolygon expects Polygon/MultiPolygon geometry, received '${polygon.type}'`,
      );
    }
    return await this.spatialRelation(polygon, point, "contains");
  }

  async pointInsidePolygon(
    point: Geometry,
    polygon: Geometry,
  ): Promise<boolean> {
    return this.pointWithinPolygon(point, polygon);
  }

  /**
   * Intersects relationship
   */
  async intersects(geomA: Geometry, geomB: Geometry): Promise<boolean> {
    return await this.spatialRelation(geomA, geomB, "intersects");
  }

  /**
   * Contains relationship
   */
  async contains(geomA: Geometry, geomB: Geometry): Promise<boolean> {
    return await this.spatialRelation(geomA, geomB, "contains");
  }

  /**
   * Within relationship
   */
  async within(geomA: Geometry, geomB: Geometry): Promise<boolean> {
    return await this.spatialRelation(geomA, geomB, "within");
  }

  /**
   * Touches relationship
   */
  async touches(geomA: Geometry, geomB: Geometry): Promise<boolean> {
    return await this.spatialRelation(geomA, geomB, "touches");
  }

  /**
   * Overlaps relationship
   */
  async overlaps(geomA: Geometry, geomB: Geometry): Promise<boolean> {
    return await this.spatialRelation(geomA, geomB, "overlaps");
  }

  /**
   * Crosses relationship
   */
  async crosses(geomA: Geometry, geomB: Geometry): Promise<boolean> {
    return await this.spatialRelation(geomA, geomB, "crosses");
  }

  /**
   * Disjoint relationship
   */
  async disjoint(geomA: Geometry, geomB: Geometry): Promise<boolean> {
    return await this.spatialRelation(geomA, geomB, "disjoint");
  }

  /**
   * Generate PostGIS buffer polygon around geometry
   */
  async buffer(
    geometry: Geometry,
    distance: number,
    unit: DistanceUnit = "meters",
  ): Promise<Geometry> {
    const validGeom = this.validator.validateStructure(geometry);

    if (typeof distance !== "number" || isNaN(distance) || distance <= 0) {
      throw new InvalidBufferError(
        `Buffer distance must be a positive number. Received: ${distance}`,
      );
    }

    let distanceMeters = distance;
    if (unit === "kilometers") distanceMeters = distance * 1000;
    if (unit === "miles") distanceMeters = distance * 1609.344;

    if (distanceMeters > SPATIAL_OPERATION_LIMITS.MAX_BUFFER_DISTANCE_METERS) {
      throw new SpatialOperationTooLargeError(
        `Buffer distance ${distanceMeters} meters exceeds maximum platform limit of ${SPATIAL_OPERATION_LIMITS.MAX_BUFFER_DISTANCE_METERS} meters`,
      );
    }

    return await this.repository.calculateBuffer(validGeom, distanceMeters);
  }

  /**
   * Union multiple geometries into a single merged geometry
   */
  async unionGeometries(geometries: Geometry[]): Promise<Geometry> {
    if (!Array.isArray(geometries) || geometries.length === 0) {
      throw new InvalidGeometryError(
        "At least one geometry is required for union",
      );
    }

    if (geometries.length > SPATIAL_OPERATION_LIMITS.MAX_UNION_GEOMETRIES) {
      throw new SpatialOperationTooLargeError(
        `Union operation geometry count (${geometries.length}) exceeds maximum limit of ${SPATIAL_OPERATION_LIMITS.MAX_UNION_GEOMETRIES}`,
      );
    }

    const validGeoms = geometries.map((g) =>
      this.validator.validateStructure(g),
    );
    return await this.repository.unionGeometries(validGeoms);
  }

  /**
   * Difference (geomA minus geomB)
   */
  async difference(geomA: Geometry, geomB: Geometry): Promise<Geometry> {
    const validA = this.validator.validateStructure(geomA);
    const validB = this.validator.validateStructure(geomB);
    return await this.repository.calculateDifference(validA, validB);
  }

  /**
   * Symmetric Difference
   */
  async symmetricDifference(
    geomA: Geometry,
    geomB: Geometry,
  ): Promise<Geometry> {
    const validA = this.validator.validateStructure(geomA);
    const validB = this.validator.validateStructure(geomB);
    return await this.repository.calculateSymmetricDifference(validA, validB);
  }

  /**
   * Convex Hull
   */
  async convexHull(geometry: Geometry): Promise<Geometry> {
    const validGeom = this.validator.validateStructure(geometry);
    return await this.repository.calculateConvexHull(validGeom);
  }

  /**
   * Intersection clipping (intersection of two geometries)
   */
  async intersectionClipping(
    geomA: Geometry,
    geomB: Geometry,
  ): Promise<Geometry> {
    const validA = this.validator.validateStructure(geomA);
    const validB = this.validator.validateStructure(geomB);
    return await this.repository.calculateClosestPoint(validA, validB);
  }

  /**
   * Nearest point on target geometry from source point
   */
  async nearestPointOnLine(
    lineOrGeom: Geometry,
    point: Geometry,
  ): Promise<Geometry> {
    const validTarget = this.validator.validateStructure(lineOrGeom);
    const validPoint = this.validator.validateStructure(point);
    return await this.repository.calculateClosestPoint(validTarget, validPoint);
  }

  /**
   * Distance from point to line/geometry
   */
  async pointToLineDistance(
    point: Geometry,
    line: Geometry,
    unit: DistanceUnit = "meters",
  ): Promise<number> {
    const res = await this.measurementService.distance(point, line, unit);
    return res.distance;
  }
}
