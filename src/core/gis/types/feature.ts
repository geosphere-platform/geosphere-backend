/**
 * GIS Core — Generic Spatial Feature Domain Model
 *
 * Business-agnostic representation of any spatial feature backed by PostGIS.
 * Supports any geometry type (Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon)
 * and generic key-value properties and metadata.
 */

import { Geometry, SpatialReference } from "./geometry";
import { GeoJsonFeature, GeoJsonFeatureCollection } from "./geojson";

export interface SpatialFeature<
  P extends Record<string, unknown> = Record<string, unknown>,
  M extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  tenantId: string;
  type: string; // Generic feature type/category (e.g. 'point_of_interest', 'boundary', 'route', 'zone')
  geometry: Geometry;
  srid: SpatialReference;
  properties: P;
  metadata: M;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Converts a SpatialFeature into a standard GeoJSON Feature
 */
export function spatialFeatureToGeoJson<
  P extends Record<string, unknown> = Record<string, unknown>,
  M extends Record<string, unknown> = Record<string, unknown>,
>(
  feature: SpatialFeature<P, M>,
): GeoJsonFeature<
  Geometry,
  P & { _id: string; _tenantId: string; _type: string; _metadata: M }
> {
  return {
    type: "Feature",
    id: feature.id,
    geometry: feature.geometry,
    properties: {
      ...feature.properties,
      _id: feature.id,
      _tenantId: feature.tenantId,
      _type: feature.type,
      _metadata: feature.metadata,
    },
  };
}

/**
 * Converts an array of SpatialFeatures into a GeoJSON FeatureCollection
 */
export function spatialFeaturesToFeatureCollection<
  P extends Record<string, unknown> = Record<string, unknown>,
  M extends Record<string, unknown> = Record<string, unknown>,
>(
  features: SpatialFeature<P, M>[],
): GeoJsonFeatureCollection<
  Geometry,
  P & { _id: string; _tenantId: string; _type: string; _metadata: M }
> {
  return {
    type: "FeatureCollection",
    features: features.map((f) => spatialFeatureToGeoJson(f)),
  };
}

/**
 * Creates a SpatialFeature instance with defaults
 */
export function createSpatialFeature<
  P extends Record<string, unknown> = Record<string, unknown>,
  M extends Record<string, unknown> = Record<string, unknown>,
>(params: {
  id?: string;
  tenantId: string;
  type: string;
  geometry: Geometry;
  properties?: P;
  metadata?: M;
  createdBy?: string;
  srid?: SpatialReference;
}): SpatialFeature<P, M> {
  const now = new Date().toISOString();
  return {
    id: params.id ?? crypto.randomUUID(),
    tenantId: params.tenantId,
    type: params.type,
    geometry: params.geometry,
    srid: params.srid ?? "EPSG:4326",
    properties: params.properties ?? ({} as P),
    metadata: params.metadata ?? ({} as M),
    createdBy: params.createdBy ?? null,
    updatedBy: params.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  };
}
