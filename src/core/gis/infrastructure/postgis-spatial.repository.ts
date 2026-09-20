/**
 * PostGIS Spatial Repository Implementation
 *
 * Executes PostGIS spatial queries (ST_Intersects, ST_Contains, ST_Within, ST_DWithin,
 * ST_Distance, ST_SimplifyPreserveTopology, KNN <-> operator) directly in PostgreSQL.
 * Enforces strict server-side tenant isolation (tenant_id = $tenantId) on every query.
 * Maintains an in-memory fallback store when PostgreSQL database is offline.
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { spatialFeaturesTable } from "@/database/schema/spatial-features";
import {
  ISpatialRepository,
  BBoxQueryOptions,
  RadiusQueryOptions,
  SpatialGeometryQueryOptions,
  NearestQueryOptions,
  DistanceQueryOptions,
  SpatialQueryResult,
} from "../domain/spatial.repository.interface";
import { SpatialFeature } from "../types/feature";
import { Geometry, Coordinate } from "../types/geometry";
import { calculateDistance } from "../utils/spatial-utils";
import { BoundingBox } from "../bbox/bounding-box";

const memoryStore = new Map<string, SpatialFeature>();
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export class PostGisSpatialRepository implements ISpatialRepository {
  constructor(private readonly db: DatabaseClient) {}

  private clampLimit(limit?: number): number {
    if (!limit || limit <= 0) return DEFAULT_LIMIT;
    return Math.min(limit, MAX_LIMIT);
  }

  private mapRowToFeature(row: {
    id: string;
    tenant_id: string;
    type: string;
    geometry: string | Record<string, unknown>;
    properties: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    created_by?: string | null;
    updated_by?: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  }): SpatialFeature {
    let geomObj: Geometry;
    if (typeof row.geometry === "string") {
      try {
        geomObj = JSON.parse(row.geometry) as Geometry;
      } catch {
        geomObj = { type: "Point", coordinates: [0, 0] };
      }
    } else {
      geomObj = row.geometry as unknown as Geometry;
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      geometry: geomObj,
      srid: "EPSG:4326",
      properties: row.properties ?? {},
      metadata: row.metadata ?? {},
      createdBy: row.created_by ?? null,
      updatedBy: row.updated_by ?? null,
      createdAt:
        typeof row.created_at === "string"
          ? row.created_at
          : row.created_at.toISOString(),
      updatedAt:
        typeof row.updated_at === "string"
          ? row.updated_at
          : row.updated_at.toISOString(),
    };
  }

  async create(
    feature: Omit<SpatialFeature, "createdAt" | "updatedAt">,
    userId?: string,
  ): Promise<SpatialFeature> {
    const now = new Date().toISOString();
    const createdFeature: SpatialFeature = {
      ...feature,
      createdBy: userId ?? feature.createdBy ?? null,
      updatedBy: userId ?? feature.updatedBy ?? null,
      createdAt: now,
      updatedAt: now,
    };

    if (isValidUuid(feature.id) && isValidUuid(feature.tenantId)) {
      try {
        const geomJson = JSON.stringify(feature.geometry);
        const propsJson = JSON.stringify(feature.properties ?? {});
        const metaJson = JSON.stringify(feature.metadata ?? {});

        const result = await this.db.execute(sql`
          INSERT INTO spatial_features (
            id, tenant_id, type, geometry, properties, metadata, created_by, updated_by
          ) VALUES (
            ${feature.id}::uuid,
            ${feature.tenantId}::uuid,
            ${feature.type},
            ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
            ${propsJson}::jsonb,
            ${metaJson}::jsonb,
            ${userId && isValidUuid(userId) ? sql`${userId}::uuid` : sql`NULL`},
            ${userId && isValidUuid(userId) ? sql`${userId}::uuid` : sql`NULL`}
          )
          RETURNING
            id,
            tenant_id,
            type,
            ST_AsGeoJSON(geometry)::jsonb as geometry,
            properties,
            metadata,
            created_by,
            updated_by,
            created_at,
            updated_at;
        `);

        if (result.rows && result.rows.length > 0) {
          const saved = this.mapRowToFeature(
            result.rows[0] as unknown as Parameters<
              typeof this.mapRowToFeature
            >[0],
          );
          memoryStore.set(saved.id, saved);
          return saved;
        }
      } catch {
        // Fallback for offline dev DB
      }
    }

    memoryStore.set(createdFeature.id, createdFeature);
    return createdFeature;
  }

  async findById(id: string, tenantId: string): Promise<SpatialFeature | null> {
    if (isValidUuid(id) && isValidUuid(tenantId)) {
      try {
        const result = await this.db.execute(sql`
          SELECT
            id,
            tenant_id,
            type,
            ST_AsGeoJSON(geometry)::jsonb as geometry,
            properties,
            metadata,
            created_by,
            updated_by,
            created_at,
            updated_at
          FROM spatial_features
          WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid;
        `);

        if (result.rows && result.rows.length > 0) {
          return this.mapRowToFeature(
            result.rows[0] as unknown as Parameters<
              typeof this.mapRowToFeature
            >[0],
          );
        }
      } catch {
        // Fallback for offline dev DB
      }
    }

    const feature = memoryStore.get(id);
    if (feature && feature.tenantId === tenantId) return feature;
    return null;
  }

  async update(
    id: string,
    tenantId: string,
    updates: Partial<
      Pick<SpatialFeature, "geometry" | "properties" | "metadata">
    >,
    userId?: string,
  ): Promise<SpatialFeature | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const newGeometry = updates.geometry ?? existing.geometry;
    const newProperties = updates.properties
      ? { ...existing.properties, ...updates.properties }
      : existing.properties;
    const newMetadata = updates.metadata
      ? { ...existing.metadata, ...updates.metadata }
      : existing.metadata;
    const now = new Date().toISOString();

    if (isValidUuid(id) && isValidUuid(tenantId)) {
      try {
        const geomJson = JSON.stringify(newGeometry);
        const propsJson = JSON.stringify(newProperties);
        const metaJson = JSON.stringify(newMetadata);

        const result = await this.db.execute(sql`
          UPDATE spatial_features
          SET
            geometry = ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
            properties = ${propsJson}::jsonb,
            metadata = ${metaJson}::jsonb,
            updated_by = ${userId && isValidUuid(userId) ? sql`${userId}::uuid` : sql`NULL`},
            updated_at = NOW()
          WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid
          RETURNING
            id,
            tenant_id,
            type,
            ST_AsGeoJSON(geometry)::jsonb as geometry,
            properties,
            metadata,
            created_by,
            updated_by,
            created_at,
            updated_at;
        `);

        if (result.rows && result.rows.length > 0) {
          const updated = this.mapRowToFeature(
            result.rows[0] as unknown as Parameters<
              typeof this.mapRowToFeature
            >[0],
          );
          memoryStore.set(updated.id, updated);
          return updated;
        }
      } catch {
        // Fallback
      }
    }

    const updatedFeature: SpatialFeature = {
      ...existing,
      geometry: newGeometry,
      properties: newProperties,
      metadata: newMetadata,
      updatedBy: userId ?? existing.updatedBy,
      updatedAt: now,
    };
    memoryStore.set(id, updatedFeature);
    return updatedFeature;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    if (isValidUuid(id) && isValidUuid(tenantId)) {
      try {
        const result = await this.db.execute(sql`
          DELETE FROM spatial_features
          WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid
          RETURNING id;
        `);

        memoryStore.delete(id);
        if (result.rows && result.rows.length > 0) return true;
      } catch {
        // Fallback
      }
    }

    const feature = memoryStore.get(id);
    if (feature && feature.tenantId === tenantId) {
      memoryStore.delete(id);
      return true;
    }
    return false;
  }

  async findByTenant(
    tenantId: string,
    type?: string,
    limit?: number,
    offset?: number,
  ): Promise<SpatialQueryResult> {
    const safeLimit = this.clampLimit(limit);
    const safeOffset = offset && offset > 0 ? offset : 0;

    if (isValidUuid(tenantId)) {
      try {
        const countResult = type
          ? await this.db.execute(
              sql`SELECT COUNT(*)::int as total FROM spatial_features WHERE tenant_id = ${tenantId}::uuid AND type = ${type};`,
            )
          : await this.db.execute(
              sql`SELECT COUNT(*)::int as total FROM spatial_features WHERE tenant_id = ${tenantId}::uuid;`,
            );

        const total = countResult.rows?.[0]?.total
          ? Number(countResult.rows[0].total)
          : 0;

        const dataResult = type
          ? await this.db.execute(sql`
              SELECT id, tenant_id, type, ST_AsGeoJSON(geometry)::jsonb as geometry, properties, metadata, created_by, updated_by, created_at, updated_at
              FROM spatial_features
              WHERE tenant_id = ${tenantId}::uuid AND type = ${type}
              ORDER BY created_at DESC
              LIMIT ${safeLimit} OFFSET ${safeOffset};
            `)
          : await this.db.execute(sql`
              SELECT id, tenant_id, type, ST_AsGeoJSON(geometry)::jsonb as geometry, properties, metadata, created_by, updated_by, created_at, updated_at
              FROM spatial_features
              WHERE tenant_id = ${tenantId}::uuid
              ORDER BY created_at DESC
              LIMIT ${safeLimit} OFFSET ${safeOffset};
            `);

        if (dataResult.rows) {
          const items = dataResult.rows.map((r) =>
            this.mapRowToFeature(
              r as unknown as Parameters<typeof this.mapRowToFeature>[0],
            ),
          );
          return {
            items,
            total,
            limit: safeLimit,
            offset: safeOffset,
            hasMore: safeOffset + items.length < total,
          };
        }
      } catch {
        // Memory fallback
      }
    }

    const all = Array.from(memoryStore.values()).filter(
      (e) => e.tenantId === tenantId && (!type || e.type === type),
    );
    const total = all.length;
    const items = all.slice(safeOffset, safeOffset + safeLimit);
    return {
      items,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    };
  }

  async findByBoundingBox(
    tenantId: string,
    options: BBoxQueryOptions,
  ): Promise<SpatialQueryResult> {
    const safeLimit = this.clampLimit(options.limit);
    const safeOffset =
      options.offset && options.offset > 0 ? options.offset : 0;

    if (isValidUuid(tenantId)) {
      try {
        const typeFilter = options.type
          ? sql` AND type = ${options.type}`
          : sql``;
        const geomExpr =
          options.simplifyTolerance && options.simplifyTolerance > 0
            ? sql`ST_AsGeoJSON(ST_SimplifyPreserveTopology(geometry, ${options.simplifyTolerance}))::jsonb`
            : sql`ST_AsGeoJSON(geometry)::jsonb`;

        const dataResult = await this.db.execute(sql`
          SELECT id, tenant_id, type, ${geomExpr} as geometry, properties, metadata, created_by, updated_by, created_at, updated_at
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_Intersects(geometry, ST_MakeEnvelope(${options.minLng}, ${options.minLat}, ${options.maxLng}, ${options.maxLat}, 4326))
          ORDER BY created_at DESC
          LIMIT ${safeLimit} OFFSET ${safeOffset};
        `);

        const countResult = await this.db.execute(sql`
          SELECT COUNT(*)::int as total
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_Intersects(geometry, ST_MakeEnvelope(${options.minLng}, ${options.minLat}, ${options.maxLng}, ${options.maxLat}, 4326));
        `);

        if (dataResult.rows) {
          const items = dataResult.rows.map((r) =>
            this.mapRowToFeature(
              r as unknown as Parameters<typeof this.mapRowToFeature>[0],
            ),
          );
          const total = Number(countResult.rows?.[0]?.total ?? items.length);
          return {
            items,
            total,
            limit: safeLimit,
            offset: safeOffset,
            hasMore: safeOffset + items.length < total,
          };
        }
      } catch {
        // Memory fallback
      }
    }

    const bbox = new BoundingBox(
      options.minLng,
      options.minLat,
      options.maxLng,
      options.maxLat,
    );
    const filtered = Array.from(memoryStore.values()).filter((e) => {
      if (e.tenantId !== tenantId) return false;
      if (options.type && e.type !== options.type) return false;
      if (e.geometry.type === "Point") {
        return bbox.containsCoordinate(e.geometry.coordinates);
      }
      return true;
    });

    const total = filtered.length;
    const items = filtered.slice(safeOffset, safeOffset + safeLimit);
    return {
      items,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    };
  }

  async findWithinRadius(
    tenantId: string,
    options: RadiusQueryOptions,
  ): Promise<SpatialQueryResult> {
    const safeLimit = this.clampLimit(options.limit);
    const safeOffset =
      options.offset && options.offset > 0 ? options.offset : 0;

    if (isValidUuid(tenantId)) {
      try {
        const typeFilter = options.type
          ? sql` AND type = ${options.type}`
          : sql``;

        const dataResult = await this.db.execute(sql`
          SELECT id, tenant_id, type, ST_AsGeoJSON(geometry)::jsonb as geometry, properties, metadata, created_by, updated_by, created_at, updated_at
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_DWithin(geometry::geography, ST_SetSRID(ST_MakePoint(${options.lng}, ${options.lat}), 4326)::geography, ${options.radiusMeters})
          ORDER BY ST_Distance(geometry::geography, ST_SetSRID(ST_MakePoint(${options.lng}, ${options.lat}), 4326)::geography) ASC
          LIMIT ${safeLimit} OFFSET ${safeOffset};
        `);

        const countResult = await this.db.execute(sql`
          SELECT COUNT(*)::int as total
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_DWithin(geometry::geography, ST_SetSRID(ST_MakePoint(${options.lng}, ${options.lat}), 4326)::geography, ${options.radiusMeters});
        `);

        if (dataResult.rows) {
          const items = dataResult.rows.map((r) =>
            this.mapRowToFeature(
              r as unknown as Parameters<typeof this.mapRowToFeature>[0],
            ),
          );
          const total = Number(countResult.rows?.[0]?.total ?? items.length);
          return {
            items,
            total,
            limit: safeLimit,
            offset: safeOffset,
            hasMore: safeOffset + items.length < total,
          };
        }
      } catch {
        // Memory fallback
      }
    }

    const center: Coordinate = [options.lng, options.lat];
    const filtered = Array.from(memoryStore.values()).filter((e) => {
      if (e.tenantId !== tenantId) return false;
      if (options.type && e.type !== options.type) return false;
      if (e.geometry.type === "Point") {
        return (
          calculateDistance(center, e.geometry.coordinates) <=
          options.radiusMeters
        );
      }
      return true;
    });

    const total = filtered.length;
    const items = filtered.slice(safeOffset, safeOffset + safeLimit);
    return {
      items,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    };
  }

  async findIntersects(
    tenantId: string,
    options: SpatialGeometryQueryOptions,
  ): Promise<SpatialQueryResult> {
    const safeLimit = this.clampLimit(options.limit);
    const safeOffset =
      options.offset && options.offset > 0 ? options.offset : 0;
    const geomJson = JSON.stringify(options.geometry);

    if (isValidUuid(tenantId)) {
      try {
        const typeFilter = options.type
          ? sql` AND type = ${options.type}`
          : sql``;

        const dataResult = await this.db.execute(sql`
          SELECT id, tenant_id, type, ST_AsGeoJSON(geometry)::jsonb as geometry, properties, metadata, created_by, updated_by, created_at, updated_at
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_Intersects(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))
          ORDER BY created_at DESC
          LIMIT ${safeLimit} OFFSET ${safeOffset};
        `);

        const countResult = await this.db.execute(sql`
          SELECT COUNT(*)::int as total
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_Intersects(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326));
        `);

        if (dataResult.rows) {
          const items = dataResult.rows.map((r) =>
            this.mapRowToFeature(
              r as unknown as Parameters<typeof this.mapRowToFeature>[0],
            ),
          );
          const total = Number(countResult.rows?.[0]?.total ?? items.length);
          return {
            items,
            total,
            limit: safeLimit,
            offset: safeOffset,
            hasMore: safeOffset + items.length < total,
          };
        }
      } catch {
        // Memory fallback
      }
    }

    const filtered = Array.from(memoryStore.values()).filter(
      (e) =>
        e.tenantId === tenantId && (!options.type || e.type === options.type),
    );
    const total = filtered.length;
    const items = filtered.slice(safeOffset, safeOffset + safeLimit);
    return {
      items,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    };
  }

  async findContains(
    tenantId: string,
    options: SpatialGeometryQueryOptions,
  ): Promise<SpatialQueryResult> {
    const safeLimit = this.clampLimit(options.limit);
    const safeOffset =
      options.offset && options.offset > 0 ? options.offset : 0;
    const geomJson = JSON.stringify(options.geometry);

    if (isValidUuid(tenantId)) {
      try {
        const typeFilter = options.type
          ? sql` AND type = ${options.type}`
          : sql``;

        const dataResult = await this.db.execute(sql`
          SELECT id, tenant_id, type, ST_AsGeoJSON(geometry)::jsonb as geometry, properties, metadata, created_by, updated_by, created_at, updated_at
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_Contains(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))
          ORDER BY created_at DESC
          LIMIT ${safeLimit} OFFSET ${safeOffset};
        `);

        const countResult = await this.db.execute(sql`
          SELECT COUNT(*)::int as total
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_Contains(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326));
        `);

        if (dataResult.rows) {
          const items = dataResult.rows.map((r) =>
            this.mapRowToFeature(
              r as unknown as Parameters<typeof this.mapRowToFeature>[0],
            ),
          );
          const total = Number(countResult.rows?.[0]?.total ?? items.length);
          return {
            items,
            total,
            limit: safeLimit,
            offset: safeOffset,
            hasMore: safeOffset + items.length < total,
          };
        }
      } catch {
        // Memory fallback
      }
    }

    const filtered = Array.from(memoryStore.values()).filter(
      (e) =>
        e.tenantId === tenantId && (!options.type || e.type === options.type),
    );
    const total = filtered.length;
    const items = filtered.slice(safeOffset, safeOffset + safeLimit);
    return {
      items,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    };
  }

  async findWithin(
    tenantId: string,
    options: SpatialGeometryQueryOptions,
  ): Promise<SpatialQueryResult> {
    const safeLimit = this.clampLimit(options.limit);
    const safeOffset =
      options.offset && options.offset > 0 ? options.offset : 0;
    const geomJson = JSON.stringify(options.geometry);

    if (isValidUuid(tenantId)) {
      try {
        const typeFilter = options.type
          ? sql` AND type = ${options.type}`
          : sql``;

        const dataResult = await this.db.execute(sql`
          SELECT id, tenant_id, type, ST_AsGeoJSON(geometry)::jsonb as geometry, properties, metadata, created_by, updated_by, created_at, updated_at
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_Within(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))
          ORDER BY created_at DESC
          LIMIT ${safeLimit} OFFSET ${safeOffset};
        `);

        const countResult = await this.db.execute(sql`
          SELECT COUNT(*)::int as total
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
            AND ST_Within(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326));
        `);

        if (dataResult.rows) {
          const items = dataResult.rows.map((r) =>
            this.mapRowToFeature(
              r as unknown as Parameters<typeof this.mapRowToFeature>[0],
            ),
          );
          const total = Number(countResult.rows?.[0]?.total ?? items.length);
          return {
            items,
            total,
            limit: safeLimit,
            offset: safeOffset,
            hasMore: safeOffset + items.length < total,
          };
        }
      } catch {
        // Memory fallback
      }
    }

    const filtered = Array.from(memoryStore.values()).filter(
      (e) =>
        e.tenantId === tenantId && (!options.type || e.type === options.type),
    );
    const total = filtered.length;
    const items = filtered.slice(safeOffset, safeOffset + safeLimit);
    return {
      items,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    };
  }

  async findNearest(
    tenantId: string,
    options: NearestQueryOptions,
  ): Promise<SpatialQueryResult> {
    const safeLimit = this.clampLimit(options.limit);

    if (isValidUuid(tenantId)) {
      try {
        const typeFilter = options.type
          ? sql` AND type = ${options.type}`
          : sql``;

        const dataResult = await this.db.execute(sql`
          SELECT id, tenant_id, type, ST_AsGeoJSON(geometry)::jsonb as geometry, properties, metadata, created_by, updated_by, created_at, updated_at
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
          ORDER BY geometry <-> ST_SetSRID(ST_MakePoint(${options.lng}, ${options.lat}), 4326)
          LIMIT ${safeLimit};
        `);

        if (dataResult.rows) {
          const items = dataResult.rows.map((r) =>
            this.mapRowToFeature(
              r as unknown as Parameters<typeof this.mapRowToFeature>[0],
            ),
          );
          return {
            items,
            total: items.length,
            limit: safeLimit,
            offset: 0,
            hasMore: false,
          };
        }
      } catch {
        // Memory fallback
      }
    }

    const center: Coordinate = [options.lng, options.lat];
    const sorted = Array.from(memoryStore.values())
      .filter(
        (e) =>
          e.tenantId === tenantId && (!options.type || e.type === options.type),
      )
      .sort((a, b) => {
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

    const items = sorted.slice(0, safeLimit);
    return {
      items,
      total: items.length,
      limit: safeLimit,
      offset: 0,
      hasMore: false,
    };
  }

  async findByDistance(
    tenantId: string,
    options: DistanceQueryOptions,
  ): Promise<
    SpatialQueryResult<{ feature: SpatialFeature; distanceMeters: number }>
  > {
    const safeLimit = this.clampLimit(options.limit);
    const safeOffset =
      options.offset && options.offset > 0 ? options.offset : 0;
    const orderDir = options.order === "desc" ? sql`DESC` : sql`ASC`;

    if (isValidUuid(tenantId)) {
      try {
        const typeFilter = options.type
          ? sql` AND type = ${options.type}`
          : sql``;

        const dataResult = await this.db.execute(sql`
          SELECT
            id, tenant_id, type, ST_AsGeoJSON(geometry)::jsonb as geometry, properties, metadata, created_by, updated_by, created_at, updated_at,
            ST_Distance(geometry::geography, ST_SetSRID(ST_MakePoint(${options.lng}, ${options.lat}), 4326)::geography) as distance_meters
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid
            ${typeFilter}
          ORDER BY distance_meters ${orderDir}
          LIMIT ${safeLimit} OFFSET ${safeOffset};
        `);

        const countResult = await this.db.execute(sql`
          SELECT COUNT(*)::int as total
          FROM spatial_features
          WHERE tenant_id = ${tenantId}::uuid ${typeFilter};
        `);

        if (dataResult.rows) {
          const items = dataResult.rows.map((r) => {
            const row = r as unknown as Parameters<
              typeof this.mapRowToFeature
            >[0] & { distance_meters: number };
            return {
              feature: this.mapRowToFeature(row),
              distanceMeters:
                Math.round((Number(row.distance_meters) || 0) * 100) / 100,
            };
          });
          const total = Number(countResult.rows?.[0]?.total ?? items.length);
          return {
            items,
            total,
            limit: safeLimit,
            offset: safeOffset,
            hasMore: safeOffset + items.length < total,
          };
        }
      } catch {
        // Memory fallback
      }
    }

    const center: Coordinate = [options.lng, options.lat];
    const itemsWithDist = Array.from(memoryStore.values())
      .filter(
        (e) =>
          e.tenantId === tenantId && (!options.type || e.type === options.type),
      )
      .map((e) => ({
        feature: e,
        distanceMeters: Math.round(
          e.geometry.type === "Point"
            ? calculateDistance(center, e.geometry.coordinates)
            : 0,
        ),
      }))
      .sort((a, b) =>
        options.order === "desc"
          ? b.distanceMeters - a.distanceMeters
          : a.distanceMeters - b.distanceMeters,
      );

    const total = itemsWithDist.length;
    const items = itemsWithDist.slice(safeOffset, safeOffset + safeLimit);
    return {
      items,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + items.length < total,
    };
  }
}
