/**
 * GIS Core — Business-Agnostic Domain Services
 *
 * High-level business-agnostic services for geometry operations, coordinate validation,
 * GeoJSON conversions, and spatial boundary evaluation.
 */

import { Coordinate, Geometry } from "../types/geometry";
import { GeoJsonFeature, GeoJsonFeatureCollection } from "../types/geojson";
import { SpatialEntity, spatialEntityToGeoJson } from "../types/entity";
import { BoundingBox } from "../bbox/bounding-box";
import {
  validateCoordinate,
  validateGeometry,
} from "../validation/geometry-validation";
import {
  calculateDistance,
  calculateBearing,
  calculateBoundingBox,
  calculateCenter,
} from "../utils/spatial-utils";

export class CoordinateService {
  public static validate(coord: unknown): Coordinate {
    return validateCoordinate(coord);
  }

  public static distance(c1: Coordinate, c2: Coordinate): number {
    return calculateDistance(c1, c2);
  }

  public static bearing(c1: Coordinate, c2: Coordinate): number {
    return calculateBearing(c1, c2);
  }
}

export class GeometryService {
  public static validate(geometry: unknown): Geometry {
    return validateGeometry(geometry);
  }

  public static getBoundingBox(geometry: Geometry): BoundingBox {
    return calculateBoundingBox(geometry);
  }

  public static getCentroid(geometry: Geometry): Coordinate {
    return calculateCenter(geometry);
  }
}

export class GeoJsonService {
  public static toFeature<P extends Record<string, unknown>>(
    entity: SpatialEntity<P>,
  ): GeoJsonFeature<
    Geometry,
    P & { entityId: string; tenantId: string; entityType: string }
  > {
    return spatialEntityToGeoJson(entity);
  }

  public static toFeatureCollection<P extends Record<string, unknown>>(
    entities: SpatialEntity<P>[],
  ): GeoJsonFeatureCollection<
    Geometry,
    P & { entityId: string; tenantId: string; entityType: string }
  > {
    return {
      type: "FeatureCollection",
      features: entities.map((e) => this.toFeature(e)),
    };
  }
}
