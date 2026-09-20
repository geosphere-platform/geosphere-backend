/**
 * GIS Core — Generic Spatial Entity Domain Model
 *
 * Business-agnostic representation of any spatial feature regardless of domain.
 * Supports Vehicles, Buildings, Assets, Geofences, Farms, Utility Pipelines, etc.
 */

import { Geometry, SpatialReference } from "./geometry";
import { GeoJsonFeature } from "./geojson";

export interface SpatialEntity<
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  tenantId: string;
  entityType: string; // e.g. 'vehicle', 'building', 'warehouse', 'pipeline', 'farm', 'asset'
  geometry: Geometry;
  srid: SpatialReference;
  properties: P;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Converts a generic SpatialEntity into a standard GeoJSON Feature
 */
export function spatialEntityToGeoJson<P extends Record<string, unknown>>(
  entity: SpatialEntity<P>,
): GeoJsonFeature<
  Geometry,
  P & { entityId: string; tenantId: string; entityType: string }
> {
  return {
    type: "Feature",
    id: entity.id,
    geometry: entity.geometry,
    properties: {
      ...entity.properties,
      entityId: entity.id,
      tenantId: entity.tenantId,
      entityType: entity.entityType,
    },
  };
}

/**
 * Creates a generic SpatialEntity instance
 */
export function createSpatialEntity<P extends Record<string, unknown>>(params: {
  id: string;
  tenantId: string;
  entityType: string;
  geometry: Geometry;
  properties: P;
  srid?: SpatialReference;
}): SpatialEntity<P> {
  const now = new Date().toISOString();
  return {
    id: params.id,
    tenantId: params.tenantId,
    entityType: params.entityType,
    geometry: params.geometry,
    srid: params.srid ?? "EPSG:4326",
    properties: params.properties,
    createdAt: now,
    updatedAt: now,
  };
}
