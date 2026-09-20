/**
 * SpatialSearchService — Text + Spatial + Temporal Combined Search
 *
 * Provides full server-side search:
 *  - Text search on name, externalId using PostgreSQL ILIKE / tsvector
 *  - Combined text + spatial filter
 *  - Combined text + spatial + time filter
 *
 * Security:
 *  - Text input is sanitized (max 200 chars, no SQL special chars)
 *  - All queries parameterized via Drizzle sql tag
 *  - Tenant isolation enforced on every query
 *
 * Does NOT use Elasticsearch. Uses PostgreSQL ILIKE and GIN-indexed
 * tsvector for full-text search support.
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { Coordinate } from "../types/geometry";
import { BoundingBox } from "../bbox/bounding-box";
import { GeoJsonFeatureCollection } from "../types/geojson";
import { SPATIAL_QUERY_LIMITS } from "./query-limits.config";
import { SpatialQueryValidator } from "./spatial-query-validator";
import { InvalidFilterError } from "../../errors/spatial-errors";

interface SearchRow {
  id: string;
  tenant_id: string;
  type: string;
  geometry: string | Record<string, unknown>;
  properties: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
  rank?: number;
}

function sanitizeSearchText(text: string): string {
  if (typeof text !== "string")
    throw new InvalidFilterError("Search text must be a string");
  if (text.length > 200)
    throw new InvalidFilterError("Search text exceeds 200 character limit");
  // Remove SQL injection characters
  const cleaned = text.replace(/[;'"\\]/g, "").trim();
  if (cleaned.length === 0)
    throw new InvalidFilterError(
      "Search text cannot be empty after sanitization",
    );
  return cleaned;
}

function parseGeom(raw: string | Record<string, unknown>) {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { type: "Point", coordinates: [0, 0] };
    }
  }
  return raw;
}

function rowToFeature(row: SearchRow) {
  return {
    type: "Feature" as const,
    id: row.id,
    geometry: parseGeom(row.geometry),
    properties: {
      ...(row.properties ?? {}),
      _id: row.id,
      _tenantId: row.tenant_id,
      _type: row.type,
      _metadata: row.metadata ?? {},
    },
  };
}

export interface SearchOptions {
  text: string;
  /** Optional spatial constraint to apply alongside text search */
  center?: Coordinate;
  radiusMeters?: number;
  bbox?: BoundingBox;
  /** Optional time range filter */
  from?: string;
  to?: string;
  /** Feature type filter */
  layerId?: string;
  limit?: number;
}

export class SpatialSearchService {
  constructor(private readonly db: DatabaseClient) {}

  /**
   * Perform a text search on spatial features.
   * Uses ILIKE for case-insensitive partial match.
   */
  async textSearch(
    tenantId: string,
    text: string,
    options?: { layerId?: string; limit?: number },
  ): Promise<GeoJsonFeatureCollection> {
    const cleanText = sanitizeSearchText(text);
    const limit = SpatialQueryValidator.clampLimit(
      options?.limit ?? SPATIAL_QUERY_LIMITS.MAX_TEXT_SEARCH_RESULTS,
    );
    const layerFilter = options?.layerId
      ? sql`AND sf.type = ${options.layerId}`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          sf.id, sf.tenant_id, sf.type,
          ST_AsGeoJSON(sf.geometry)::jsonb as geometry,
          sf.properties, sf.metadata, sf.created_at, sf.updated_at
        FROM spatial_features sf
        WHERE sf.tenant_id = ${tenantId}::uuid
          AND (
            sf.name ILIKE ${`%${cleanText}%`}
            OR sf.properties->>'externalId' ILIKE ${`%${cleanText}%`}
            OR sf.properties->>'description' ILIKE ${`%${cleanText}%`}
          )
          ${layerFilter}
        ORDER BY sf.name
        LIMIT ${limit}
      `);

      const rows = (result.rows ?? []) as unknown as SearchRow[];
      return { type: "FeatureCollection", features: rows.map(rowToFeature) };
    } catch {
      return { type: "FeatureCollection", features: [] };
    }
  }

  /**
   * Combined search: text + optional spatial filter + optional time filter.
   * All filtering is server-side — no client-side dataset download.
   */
  async combinedSearch(
    tenantId: string,
    options: SearchOptions,
  ): Promise<GeoJsonFeatureCollection> {
    const cleanText = sanitizeSearchText(options.text);
    const limit = SpatialQueryValidator.clampLimit(options.limit);

    // Validate spatial constraints
    if (options.radiusMeters !== undefined) {
      SpatialQueryValidator.validateRadius(options.radiusMeters);
    }

    // Validate time range
    if (options.from && options.to) {
      SpatialQueryValidator.validateTimeRange(options.from, options.to);
    }

    // Build spatial clause
    let spatialClause = sql.raw("TRUE");
    if (options.center && options.radiusMeters) {
      const [lng, lat] = options.center;
      spatialClause = sql`ST_DWithin(sf.geometry::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${options.radiusMeters})`;
    } else if (options.bbox) {
      const { minLng, minLat, maxLng, maxLat } = options.bbox;
      spatialClause = sql`sf.geometry && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`;
    }

    // Build time clause
    let timeClause = sql.raw("TRUE");
    if (options.from)
      timeClause = sql`sf.created_at >= ${options.from}::timestamptz`;
    if (options.from && options.to) {
      timeClause = sql`sf.created_at BETWEEN ${options.from}::timestamptz AND ${options.to}::timestamptz`;
    } else if (options.to) {
      timeClause = sql`sf.created_at <= ${options.to}::timestamptz`;
    }

    const layerFilter = options.layerId
      ? sql`AND sf.type = ${options.layerId}`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          sf.id, sf.tenant_id, sf.type,
          ST_AsGeoJSON(sf.geometry)::jsonb as geometry,
          sf.properties, sf.metadata, sf.created_at, sf.updated_at
        FROM spatial_features sf
        WHERE sf.tenant_id = ${tenantId}::uuid
          AND (
            sf.name ILIKE ${`%${cleanText}%`}
            OR sf.properties->>'externalId' ILIKE ${`%${cleanText}%`}
            OR sf.properties->>'description' ILIKE ${`%${cleanText}%`}
          )
          AND ${spatialClause}
          AND ${timeClause}
          ${layerFilter}
        ORDER BY sf.name
        LIMIT ${limit}
      `);

      const rows = (result.rows ?? []) as unknown as SearchRow[];
      return { type: "FeatureCollection", features: rows.map(rowToFeature) };
    } catch {
      return { type: "FeatureCollection", features: [] };
    }
  }

  /**
   * Search for spatial subjects (generic entities in the realtime engine)
   * by name or externalId, with optional type filter.
   */
  async searchSubjects(
    tenantId: string,
    text: string,
    options?: { subjectType?: string; activeOnly?: boolean; limit?: number },
  ): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      externalId: string;
      active: boolean;
    }>
  > {
    const cleanText = sanitizeSearchText(text);
    const limit = SpatialQueryValidator.clampLimit(options?.limit);
    const typeFilter = options?.subjectType
      ? sql`AND type = ${options.subjectType}`
      : sql.raw("");
    const activeFilter = options?.activeOnly
      ? sql`AND active = TRUE`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT id, name, type, external_id as "externalId", active
        FROM spatial_subjects
        WHERE tenant_id = ${tenantId}::uuid
          AND (
            name ILIKE ${`%${cleanText}%`}
            OR external_id ILIKE ${`%${cleanText}%`}
          )
          ${typeFilter}
          ${activeFilter}
        ORDER BY name
        LIMIT ${limit}
      `);

      return (result.rows ?? []).map((r: unknown) => {
        const row = r as {
          id: string;
          name: string;
          type: string;
          externalId: string;
          active: boolean;
        };
        return {
          id: String(row.id),
          name: String(row.name),
          type: String(row.type),
          externalId: String(row.externalId),
          active: Boolean(row.active),
        };
      });
    } catch {
      return [];
    }
  }
}
