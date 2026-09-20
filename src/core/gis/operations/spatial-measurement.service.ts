/**
 * SpatialMeasurementService — Generic Spatial Measurement & Calculation Service
 *
 * Provides accurate spatial calculations for distance, area, line length, centroid,
 * representative interior point, and bounding box computations using PostGIS geography.
 */

import { Geometry } from "../types/geometry";
import { BoundingBox, BoundingBoxTuple } from "../bbox/bounding-box";
import { PostGisOperationsRepository } from "./postgis-operations.repository";
import { GeometryValidationService } from "./geometry-validation.service";
import { InvalidDistanceError } from "../../errors/spatial-errors";

export type DistanceUnit = "meters" | "kilometers" | "miles";
export type AreaUnit = "sq_meters" | "sq_kilometers" | "hectares";
export type LengthUnit = "meters" | "kilometers";

export interface DistanceResult {
  distance: number;
  unit: DistanceUnit;
  distanceMeters: number;
}

export interface AreaResult {
  area: number;
  unit: AreaUnit;
  areaSqMeters: number;
}

export interface LengthResult {
  length: number;
  unit: LengthUnit;
  lengthMeters: number;
}

export class SpatialMeasurementService {
  constructor(
    private readonly repository: PostGisOperationsRepository,
    private readonly validator: GeometryValidationService,
  ) {}

  /**
   * Convert distance in meters to target unit
   */
  private convertDistance(meters: number, unit: DistanceUnit): number {
    switch (unit) {
      case "kilometers":
        return meters / 1000;
      case "miles":
        return meters / 1609.344;
      case "meters":
      default:
        return meters;
    }
  }

  /**
   * Convert area in sq meters to target unit
   */
  private convertArea(sqMeters: number, unit: AreaUnit): number {
    switch (unit) {
      case "sq_kilometers":
        return sqMeters / 1_000_000;
      case "hectares":
        return sqMeters / 10_000;
      case "sq_meters":
      default:
        return sqMeters;
    }
  }

  /**
   * Calculate distance between two geometries (Point, Line, Polygon)
   */
  async distance(
    geomA: Geometry,
    geomB: Geometry,
    unit: DistanceUnit = "meters",
  ): Promise<DistanceResult> {
    const validA = this.validator.validateStructure(geomA);
    const validB = this.validator.validateStructure(geomB);

    const distMeters = await this.repository.calculateDistance(validA, validB);
    if (isNaN(distMeters) || distMeters < 0) {
      throw new InvalidDistanceError("Computed distance was invalid");
    }

    const converted = this.convertDistance(distMeters, unit);
    return {
      distance: Number(converted.toFixed(3)),
      unit,
      distanceMeters: Number(distMeters.toFixed(3)),
    };
  }

  /**
   * Calculate surface area of Polygon / MultiPolygon
   */
  async area(
    geometry: Geometry,
    unit: AreaUnit = "sq_meters",
  ): Promise<AreaResult> {
    const validGeom = this.validator.validateStructure(geometry);
    if (validGeom.type !== "Polygon" && validGeom.type !== "MultiPolygon") {
      throw new InvalidDistanceError(
        `Area calculation requires Polygon or MultiPolygon, received '${validGeom.type}'`,
      );
    }

    const sqMeters = await this.repository.calculateArea(validGeom);
    const converted = this.convertArea(sqMeters, unit);

    return {
      area: Number(converted.toFixed(3)),
      unit,
      areaSqMeters: Number(sqMeters.toFixed(3)),
    };
  }

  /**
   * Calculate length of LineString / MultiLineString
   */
  async length(
    geometry: Geometry,
    unit: LengthUnit = "meters",
  ): Promise<LengthResult> {
    const validGeom = this.validator.validateStructure(geometry);
    if (
      validGeom.type !== "LineString" &&
      validGeom.type !== "MultiLineString"
    ) {
      throw new InvalidDistanceError(
        `Length calculation requires LineString or MultiLineString, received '${validGeom.type}'`,
      );
    }

    const meters = await this.repository.calculateLength(validGeom);
    const converted = unit === "kilometers" ? meters / 1000 : meters;

    return {
      length: Number(converted.toFixed(3)),
      unit,
      lengthMeters: Number(meters.toFixed(3)),
    };
  }

  /**
   * Calculate geometric center of mass (Centroid)
   */
  async centroid(geometry: Geometry): Promise<Geometry> {
    const validGeom = this.validator.validateStructure(geometry);
    return await this.repository.calculateCentroid(validGeom);
  }

  /**
   * Calculate guaranteed interior representative point (ST_PointOnSurface)
   */
  async representativePoint(geometry: Geometry): Promise<Geometry> {
    const validGeom = this.validator.validateStructure(geometry);
    return await this.repository.calculateRepresentativePoint(validGeom);
  }

  /**
   * Compute bounding box for geometry
   */
  boundingBox(geometry: Geometry): {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
    bbox: BoundingBoxTuple;
  } {
    const validGeom = this.validator.validateStructure(geometry);
    const bbox = BoundingBox.fromGeometry(validGeom);
    return {
      minLng: bbox.minLng,
      minLat: bbox.minLat,
      maxLng: bbox.maxLng,
      maxLat: bbox.maxLat,
      bbox: bbox.toTuple(),
    };
  }
}
