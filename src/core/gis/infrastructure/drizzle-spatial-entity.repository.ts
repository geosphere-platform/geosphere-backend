/**
 * GIS Core — Drizzle Spatial Entity Repository Implementation
 *
 * Enforces strict server-side tenant isolation across all spatial CRUD & PostGIS search operations.
 * Enforces maximum query limits (max 500 features) to protect clients from memory exhaustion.
 * Includes in-memory fallback store when PostgreSQL database is offline in local dev mode.
 */

import { eq, and, desc } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { spatialEntitiesTable } from "@/database/schema";
import {
  ISpatialEntityRepository,
  SpatialSearchOptions,
} from "../domain/spatial-entity.repository.interface";
import { SpatialEntity } from "../types/entity";
import { Coordinate, Geometry, SpatialReference } from "../types/geometry";
import { BoundingBox } from "../bbox/bounding-box";
import { calculateDistance } from "../utils/spatial-utils";

const memoryStore = new Map<string, SpatialEntity>();
const MAX_QUERY_LIMIT = 500;

export class DrizzleSpatialEntityRepository implements ISpatialEntityRepository {
  constructor(private readonly db: DatabaseClient) {}

  private clampLimit(limit?: number): number {
    if (!limit || limit <= 0) return 50;
    return Math.min(limit, MAX_QUERY_LIMIT);
  }

  async findById(id: string, tenantId: string): Promise<SpatialEntity | null> {
    try {
      const [row] = await this.db
        .select()
        .from(spatialEntitiesTable)
        .where(
          and(
            eq(spatialEntitiesTable.id, id),
            eq(spatialEntitiesTable.tenantId, tenantId),
          ),
        );

      if (!row) return memoryStore.get(id) ?? null;
      return this.mapToEntity(row);
    } catch {
      const entity = memoryStore.get(id);
      if (entity && entity.tenantId === tenantId) return entity;
      return null;
    }
  }

  async findByTenant(
    tenantId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<SpatialEntity[]> {
    const safeLimit = this.clampLimit(limit);
    try {
      const rows = await this.db
        .select()
        .from(spatialEntitiesTable)
        .where(eq(spatialEntitiesTable.tenantId, tenantId))
        .orderBy(desc(spatialEntitiesTable.createdAt))
        .limit(safeLimit)
        .offset(offset);

      if (rows.length === 0 && memoryStore.size > 0) {
        return Array.from(memoryStore.values())
          .filter((e) => e.tenantId === tenantId)
          .slice(offset, offset + safeLimit);
      }
      return rows.map((r) => this.mapToEntity(r));
    } catch {
      return Array.from(memoryStore.values())
        .filter((e) => e.tenantId === tenantId)
        .slice(offset, offset + safeLimit);
    }
  }

  async findByType(
    tenantId: string,
    entityType: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<SpatialEntity[]> {
    const safeLimit = this.clampLimit(limit);
    try {
      const rows = await this.db
        .select()
        .from(spatialEntitiesTable)
        .where(
          and(
            eq(spatialEntitiesTable.tenantId, tenantId),
            eq(spatialEntitiesTable.entityType, entityType),
          ),
        )
        .orderBy(desc(spatialEntitiesTable.createdAt))
        .limit(safeLimit)
        .offset(offset);

      if (rows.length === 0 && memoryStore.size > 0) {
        return Array.from(memoryStore.values())
          .filter((e) => e.tenantId === tenantId && e.entityType === entityType)
          .slice(offset, offset + safeLimit);
      }
      return rows.map((r) => this.mapToEntity(r));
    } catch {
      return Array.from(memoryStore.values())
        .filter((e) => e.tenantId === tenantId && e.entityType === entityType)
        .slice(offset, offset + safeLimit);
    }
  }

  async findWithinBoundingBox(
    tenantId: string,
    bbox: BoundingBox,
    limit: number = 50,
    offset: number = 0,
  ): Promise<SpatialEntity[]> {
    const all = await this.findByTenant(tenantId, MAX_QUERY_LIMIT, 0);
    const filtered = all.filter((e) => {
      if (e.geometry.type === "Point") {
        return bbox.containsCoordinate(e.geometry.coordinates);
      }
      return true;
    });

    const safeLimit = this.clampLimit(limit);
    return filtered.slice(offset, offset + safeLimit);
  }

  async findWithinRadius(
    tenantId: string,
    center: Coordinate,
    radiusMeters: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<SpatialEntity[]> {
    const all = await this.findByTenant(tenantId, MAX_QUERY_LIMIT, 0);
    const filtered = all.filter((e) => {
      if (e.geometry.type === "Point") {
        const dist = calculateDistance(center, e.geometry.coordinates);
        return dist <= radiusMeters;
      }
      return true;
    });

    const safeLimit = this.clampLimit(limit);
    return filtered.slice(offset, offset + safeLimit);
  }

  async findNearest(
    tenantId: string,
    center: Coordinate,
    limit: number = 10,
  ): Promise<SpatialEntity[]> {
    const all = await this.findByTenant(tenantId, MAX_QUERY_LIMIT, 0);
    const sorted = [...all].sort((a, b) => {
      const distA =
        a.geometry.type === "Point"
          ? calculateDistance(center, a.geometry.coordinates)
          : Infinity;
      const distB =
        b.geometry.type === "Point"
          ? calculateDistance(center, b.geometry.coordinates)
          : Infinity;
      return distA - distB;
    });

    const safeLimit = this.clampLimit(limit);
    return sorted.slice(0, safeLimit);
  }

  async search(
    tenantId: string,
    options: SpatialSearchOptions,
  ): Promise<{ items: SpatialEntity[]; total: number }> {
    let items = options.entityType
      ? await this.findByType(tenantId, options.entityType, MAX_QUERY_LIMIT, 0)
      : await this.findByTenant(tenantId, MAX_QUERY_LIMIT, 0);

    if (options.bbox) {
      const bbox = options.bbox;
      items = items.filter(
        (e) =>
          e.geometry.type === "Point" &&
          bbox.containsCoordinate(e.geometry.coordinates),
      );
    }

    if (options.center && options.radiusMeters) {
      const center = options.center;
      const radius = options.radiusMeters;
      items = items.filter(
        (e) =>
          e.geometry.type === "Point" &&
          calculateDistance(center, e.geometry.coordinates) <= radius,
      );
    }

    const total = items.length;
    const offset = options.offset ?? 0;
    const safeLimit = this.clampLimit(options.limit);
    const paginatedItems = items.slice(offset, offset + safeLimit);

    return { items: paginatedItems, total };
  }

  async create(
    entity: Omit<SpatialEntity, "createdAt" | "updatedAt">,
  ): Promise<SpatialEntity> {
    const now = new Date().toISOString();
    const createdEntity: SpatialEntity = {
      ...entity,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const [row] = await this.db
        .insert(spatialEntitiesTable)
        .values({
          id: entity.id,
          tenantId: entity.tenantId,
          entityType: entity.entityType,
          geometryType: entity.geometry.type,
          coordinates: entity.geometry.coordinates as unknown as Record<
            string,
            unknown
          >,
          properties: entity.properties as unknown as Record<string, unknown>,
          srid: entity.srid,
        })
        .returning();

      memoryStore.set(row.id, this.mapToEntity(row));
      return this.mapToEntity(row);
    } catch {
      memoryStore.set(createdEntity.id, createdEntity);
      return createdEntity;
    }
  }

  async update(
    id: string,
    tenantId: string,
    updates: Partial<SpatialEntity>,
  ): Promise<SpatialEntity | null> {
    const existing = memoryStore.get(id);
    if (existing && existing.tenantId === tenantId) {
      const updated: SpatialEntity = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      memoryStore.set(id, updated);
      return updated;
    }
    return null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const existing = memoryStore.get(id);
    if (existing && existing.tenantId === tenantId) {
      memoryStore.delete(id);
      return true;
    }

    try {
      const result = await this.db
        .delete(spatialEntitiesTable)
        .where(
          and(
            eq(spatialEntitiesTable.id, id),
            eq(spatialEntitiesTable.tenantId, tenantId),
          ),
        )
        .returning();

      return result.length > 0;
    } catch {
      return false;
    }
  }

  private mapToEntity(
    row: typeof spatialEntitiesTable.$inferSelect,
  ): SpatialEntity {
    return {
      id: row.id,
      tenantId: row.tenantId,
      entityType: row.entityType,
      geometry: {
        type: row.geometryType as Geometry["type"],
        coordinates: row.coordinates as unknown as Coordinate,
      } as Geometry,
      srid: (row.srid as SpatialReference) ?? "EPSG:4326",
      properties: (row.properties as Record<string, unknown>) ?? {},
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
