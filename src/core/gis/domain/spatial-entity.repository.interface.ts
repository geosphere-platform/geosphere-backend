/**
 * GIS Core — Spatial Entity Repository Interface
 *
 * Generic contract for spatial data storage, PostGIS spatial queries, and multi-tenant spatial searches.
 */

import { SpatialEntity } from "../types/entity";
import { Coordinate } from "../types/geometry";
import { BoundingBox } from "../bbox/bounding-box";

export interface SpatialSearchOptions {
  entityType?: string;
  bbox?: BoundingBox;
  center?: Coordinate;
  radiusMeters?: number;
  limit?: number;
  offset?: number;
}

export interface ISpatialEntityRepository {
  findById(id: string, tenantId: string): Promise<SpatialEntity | null>;
  findByTenant(
    tenantId: string,
    limit?: number,
    offset?: number,
  ): Promise<SpatialEntity[]>;
  findByType(
    tenantId: string,
    entityType: string,
    limit?: number,
    offset?: number,
  ): Promise<SpatialEntity[]>;
  findWithinBoundingBox(
    tenantId: string,
    bbox: BoundingBox,
    limit?: number,
    offset?: number,
  ): Promise<SpatialEntity[]>;
  findWithinRadius(
    tenantId: string,
    center: Coordinate,
    radiusMeters: number,
    limit?: number,
    offset?: number,
  ): Promise<SpatialEntity[]>;
  findNearest(
    tenantId: string,
    center: Coordinate,
    limit?: number,
  ): Promise<SpatialEntity[]>;
  search(
    tenantId: string,
    options: SpatialSearchOptions,
  ): Promise<{ items: SpatialEntity[]; total: number }>;
  create(
    entity: Omit<SpatialEntity, "createdAt" | "updatedAt">,
  ): Promise<SpatialEntity>;
  update(
    id: string,
    tenantId: string,
    updates: Partial<SpatialEntity>,
  ): Promise<SpatialEntity | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
}
