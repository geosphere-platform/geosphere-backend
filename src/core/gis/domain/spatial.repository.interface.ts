/**
 * GIS Core — Spatial Repository Domain Interface
 *
 * Contract for business-agnostic PostGIS spatial feature repository operations.
 * Enforces server-side tenant boundaries across all CRUD and spatial search operations.
 */

import { SpatialFeature } from "../types/feature";
import { Geometry } from "../types/geometry";

export interface BBoxQueryOptions {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
  type?: string;
  simplifyTolerance?: number;
  limit?: number;
  offset?: number;
}

export interface RadiusQueryOptions {
  lng: number;
  lat: number;
  radiusMeters: number;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface SpatialGeometryQueryOptions {
  geometry: Geometry;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface NearestQueryOptions {
  lng: number;
  lat: number;
  type?: string;
  limit?: number;
}

export interface DistanceQueryOptions {
  lng: number;
  lat: number;
  type?: string;
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface SpatialQueryResult<T = SpatialFeature> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ISpatialRepository {
  create(
    feature: Omit<SpatialFeature, "createdAt" | "updatedAt">,
    userId?: string,
  ): Promise<SpatialFeature>;

  findById(id: string, tenantId: string): Promise<SpatialFeature | null>;

  update(
    id: string,
    tenantId: string,
    updates: Partial<
      Pick<SpatialFeature, "geometry" | "properties" | "metadata">
    >,
    userId?: string,
  ): Promise<SpatialFeature | null>;

  delete(id: string, tenantId: string): Promise<boolean>;

  findByTenant(
    tenantId: string,
    type?: string,
    limit?: number,
    offset?: number,
  ): Promise<SpatialQueryResult>;

  findByBoundingBox(
    tenantId: string,
    options: BBoxQueryOptions,
  ): Promise<SpatialQueryResult>;

  findWithinRadius(
    tenantId: string,
    options: RadiusQueryOptions,
  ): Promise<SpatialQueryResult>;

  findIntersects(
    tenantId: string,
    options: SpatialGeometryQueryOptions,
  ): Promise<SpatialQueryResult>;

  findContains(
    tenantId: string,
    options: SpatialGeometryQueryOptions,
  ): Promise<SpatialQueryResult>;

  findWithin(
    tenantId: string,
    options: SpatialGeometryQueryOptions,
  ): Promise<SpatialQueryResult>;

  findNearest(
    tenantId: string,
    options: NearestQueryOptions,
  ): Promise<SpatialQueryResult>;

  findByDistance(
    tenantId: string,
    options: DistanceQueryOptions,
  ): Promise<
    SpatialQueryResult<{ feature: SpatialFeature; distanceMeters: number }>
  >;
}
