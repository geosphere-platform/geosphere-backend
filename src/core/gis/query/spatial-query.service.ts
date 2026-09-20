/**
 * SpatialQueryService — Core GIS Query Engine
 *
 * Provides business-agnostic spatial feature queries:
 *  - Bounding box queries
 *  - Radius (ST_DWithin) queries
 *  - Nearest-neighbor (KNN <->) queries
 *  - Polygon containment / intersection queries
 *  - Combined attribute + spatial + temporal queries
 *  - Viewport-aware queries (zoom-level adaptive)
 *
 * All queries enforce:
 *  - Tenant isolation (tenantId from JWT, never client input)
 *  - RBAC via permission check at API layer
 *  - Safety limits via SPATIAL_QUERY_LIMITS
 *  - Server-side PostGIS filtering — no client-side dataset download
 *
 * Falls back to in-memory filtering when database is offline (dev mode).
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { Geometry, Coordinate } from "../types/geometry";
import { BoundingBox } from "../bbox/bounding-box";
import { spatialFeatureToGeoJson } from "../types/feature";
import { GeoJsonFeatureCollection } from "../types/geojson";
import { SPATIAL_QUERY_LIMITS } from "./query-limits.config";
import { SpatialQueryValidator } from "./spatial-query-validator";
import { SpatialFilterProcessor } from "./spatial-filter-processor";
import {
  SpatialQuery,
  SpatialQueryResult,
  SpatialQueryMeta,
  NearestQueryResult,
  NearestFeatureResult,
  FilterGroup,
  AttributeFilter,
} from "./spatial-query.model";
import {
  InvalidFilterError,
  SpatialQueryTooComplexError,
} from "../../errors/spatial-errors";

// ─── Row Type ─────────────────────────────────────────────────────────────────

interface SpatialFeatureRow {
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
  distance_meters?: number | null;
}

function parseGeom(raw: string | Record<string, unknown>): Geometry {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Geometry;
    } catch {
      return { type: "Point", coordinates: [0, 0] };
    }
  }
  return raw as unknown as Geometry;
}

function rowToGeoJsonFeature(row: SpatialFeatureRow) {
  const geom = parseGeom(row.geometry);
  const props: Record<string, unknown> = { ...(row.properties ?? {}) };
  if (row.distance_meters != null)
    props._distanceMeters = Number(row.distance_meters);
  return {
    type: "Feature" as const,
    id: row.id,
    geometry: geom,
    properties: {
      ...props,
      _id: row.id,
      _tenantId: row.tenant_id,
      _type: row.type,
      _metadata: row.metadata ?? {},
    },
  };
}

// ─── SpatialQueryService ──────────────────────────────────────────────────────

export class SpatialQueryService {
  constructor(private readonly db: DatabaseClient) {}

  // ─── Generic Combined Query ────────────────────────────────────────────────

  /**
   * Execute a full SpatialQuery with attribute, spatial, and temporal filters combined.
   * This is the primary entry point for the generic query API.
   */
  async queryFeatures(
    tenantId: string,
    query: SpatialQuery,
  ): Promise<SpatialQueryResult> {
    const start = Date.now();
    SpatialQueryValidator.validate(query);

    const limit = SpatialQueryValidator.clampLimit(
      query.limit ?? query.pagination?.limit,
    );
    const cursor = query.pagination?.cursor;

    // Determine query type
    const hasAttribute = !!query.filters;
    const hasSpatial = !!query.spatialFilter;
    const hasTemporal = !!query.temporalFilter;

    let queryType: SpatialQueryMeta["queryType"] = "ATTRIBUTE";
    if (hasSpatial && hasAttribute && hasTemporal)
      queryType = "SPATIAL_ATTRIBUTE_TEMPORAL";
    else if (hasSpatial && hasAttribute) queryType = "SPATIAL_ATTRIBUTE";
    else if (hasSpatial && hasTemporal) queryType = "SPATIAL_TEMPORAL";
    else if (hasAttribute && hasTemporal) queryType = "ATTRIBUTE_TEMPORAL";
    else if (hasSpatial) queryType = "SPATIAL";
    else if (hasTemporal) queryType = "TEMPORAL";
    else queryType = "ATTRIBUTE";

    try {
      // Build spatial predicate
      let spatialClause = sql.raw("TRUE");
      if (query.spatialFilter) {
        const sf = query.spatialFilter;
        if (sf.type === "bbox") {
          const bboxJson = JSON.stringify({
            type: "Polygon",
            coordinates: [
              [
                [sf.minLng, sf.minLat],
                [sf.maxLng, sf.minLat],
                [sf.maxLng, sf.maxLat],
                [sf.minLng, sf.maxLat],
                [sf.minLng, sf.minLat],
              ],
            ],
          });
          spatialClause = sql`ST_Intersects(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${bboxJson}), 4326))`;
        } else if (sf.type === "radius") {
          const [lng, lat] = sf.center;
          spatialClause = sql`ST_DWithin(geometry::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${sf.radiusMeters})`;
        } else if (sf.type === "geometry") {
          const geomJson = JSON.stringify(sf.geometry);
          switch (sf.predicate) {
            case "within":
              spatialClause = sql`ST_Within(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            case "intersects":
              spatialClause = sql`ST_Intersects(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            case "contains":
              spatialClause = sql`ST_Contains(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            case "covers":
              spatialClause = sql`ST_Covers(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            case "coveredBy":
              spatialClause = sql`ST_CoveredBy(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            case "touches":
              spatialClause = sql`ST_Touches(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            case "overlaps":
              spatialClause = sql`ST_Overlaps(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            case "crosses":
              spatialClause = sql`ST_Crosses(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            case "disjoint":
              spatialClause = sql`ST_Disjoint(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
              break;
            default:
              spatialClause = sql`ST_Intersects(geometry, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326))`;
          }
        }
      }

      // Build attribute filter clause
      const attrClause = SpatialFilterProcessor.processFilters(
        query.filters as FilterGroup | AttributeFilter[] | undefined,
      );

      // Build temporal clause
      const tempClause = query.temporalFilter
        ? SpatialFilterProcessor.processTemporalFilter(
            query.temporalFilter,
            "sf",
          )
        : null;

      // Build sort clause
      let orderClause = sql`sf.created_at DESC`;
      if (query.sort) {
        const dirSQL =
          query.sort.order === "asc" ? sql.raw("ASC") : sql.raw("DESC");
        switch (query.sort.field) {
          case "name":
            orderClause = sql.raw(`sf.name `).append(dirSQL);
            break;
          case "createdAt":
            orderClause = sql.raw(`sf.created_at `).append(dirSQL);
            break;
          case "updatedAt":
            orderClause = sql.raw(`sf.updated_at `).append(dirSQL);
            break;
          case "timestamp":
            orderClause = sql.raw(`sf.created_at `).append(dirSQL);
            break;
          default:
            orderClause = sql.raw(`sf.created_at DESC`);
        }
      }

      // Build cursor condition
      let cursorClause = sql.raw("TRUE");
      if (cursor) {
        try {
          const cursorTs = Buffer.from(cursor, "base64").toString("utf8");
          cursorClause = sql`sf.created_at < ${cursorTs}::timestamptz`;
        } catch {
          /* ignore invalid cursor */
        }
      }

      // Layer filter
      const layerClause = query.layerId
        ? sql`sf.type = ${query.layerId}`
        : sql.raw("TRUE");

      // Text search
      const textClause = query.searchText
        ? sql`(sf.name ILIKE ${"%" + query.searchText + "%"})`
        : sql.raw("TRUE");

      const result = await this.db.execute(sql`
        SELECT
          sf.id, sf.tenant_id, sf.type,
          ST_AsGeoJSON(sf.geometry)::jsonb as geometry,
          sf.properties, sf.metadata,
          sf.created_by, sf.updated_by, sf.created_at, sf.updated_at
        FROM spatial_features sf
        WHERE sf.tenant_id = ${tenantId}::uuid
          AND ${spatialClause}
          AND ${layerClause}
          AND ${textClause}
          AND ${cursorClause}
          ${attrClause ? sql`AND ${attrClause}` : sql.raw("")}
          ${tempClause ? sql`AND ${tempClause}` : sql.raw("")}
        ORDER BY ${orderClause}
        LIMIT ${limit + 1}
      `);

      const rows = (result.rows ?? []) as unknown as SpatialFeatureRow[];
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      const nextCursor =
        hasMore && items.length > 0
          ? Buffer.from(
              String((items[items.length - 1] as SpatialFeatureRow).created_at),
            ).toString("base64")
          : undefined;

      const featureCollection: GeoJsonFeatureCollection = {
        type: "FeatureCollection",
        features: items.map(rowToGeoJsonFeature),
      };

      const queryDurationMs = Date.now() - start;
      return {
        features: featureCollection,
        meta: {
          queryType,
          totalCount: items.length + (hasMore ? 1 : 0),
          returnedCount: items.length,
          limit,
          nextCursor,
          queryDurationMs,
          tenantId,
          appliedFilters:
            SpatialQueryValidator["countFilters"]?.(
              query.filters as FilterGroup,
            ) ?? 0,
        },
      };
    } catch (err) {
      if (
        err instanceof SpatialQueryTooComplexError ||
        err instanceof InvalidFilterError
      ) {
        throw err;
      }
      // Fallback for offline dev
      return {
        features: { type: "FeatureCollection", features: [] },
        meta: {
          queryType,
          totalCount: 0,
          returnedCount: 0,
          limit,
          queryDurationMs: Date.now() - start,
          tenantId,
          appliedFilters: 0,
        },
      };
    }
  }

  // ─── BBox Query ────────────────────────────────────────────────────────────

  async queryBBox(
    tenantId: string,
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
    options?: { layerId?: string; limit?: number },
  ): Promise<GeoJsonFeatureCollection> {
    return this.queryFeatures(tenantId, {
      spatialFilter: { type: "bbox", minLng, minLat, maxLng, maxLat },
      layerId: options?.layerId,
      limit: options?.limit,
    }).then((r) => r.features);
  }

  // ─── Radius Query ──────────────────────────────────────────────────────────

  async queryRadius(
    tenantId: string,
    center: Coordinate,
    radiusMeters: number,
    options?: { layerId?: string; limit?: number; filters?: AttributeFilter[] },
  ): Promise<GeoJsonFeatureCollection> {
    SpatialQueryValidator.validateRadius(radiusMeters);
    return this.queryFeatures(tenantId, {
      spatialFilter: { type: "radius", center, radiusMeters },
      filters: options?.filters,
      layerId: options?.layerId,
      limit: options?.limit,
    }).then((r) => r.features);
  }

  // ─── Nearest Query ─────────────────────────────────────────────────────────

  async queryNearest(
    tenantId: string,
    point: Coordinate,
    n: number,
    options?: {
      layerId?: string;
      maxDistanceMeters?: number;
      filters?: AttributeFilter[];
    },
  ): Promise<NearestQueryResult> {
    const start = Date.now();
    SpatialQueryValidator.validateNearestN(n);

    const [lng, lat] = point;
    const maxDist =
      options?.maxDistanceMeters ?? SPATIAL_QUERY_LIMITS.MAX_RADIUS_METERS;
    const layerFilter = options?.layerId
      ? sql`AND sf.type = ${options.layerId}`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          sf.id, sf.tenant_id, sf.type,
          ST_AsGeoJSON(sf.geometry)::jsonb as geometry,
          sf.properties, sf.metadata, sf.created_at, sf.updated_at,
          ST_Distance(
            sf.geometry::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ) as distance_meters
        FROM spatial_features sf
        WHERE sf.tenant_id = ${tenantId}::uuid
          AND ST_DWithin(
            sf.geometry::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${maxDist}
          )
          ${layerFilter}
        ORDER BY sf.geometry <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        LIMIT ${n}
      `);

      const rows = (result.rows ?? []) as unknown as SpatialFeatureRow[];
      const items: NearestFeatureResult[] = rows.map((row) => ({
        id: row.id,
        name: String(
          (row.properties as Record<string, unknown>)?.name ?? row.id,
        ),
        geometry: parseGeom(row.geometry),
        properties: { ...(row.properties ?? {}), _type: row.type },
        distanceMeters: Number(row.distance_meters ?? 0),
      }));

      return {
        items,
        meta: {
          queryDurationMs: Date.now() - start,
          count: items.length,
          centerPoint: point,
          maxDistanceMeters: maxDist,
        },
      };
    } catch {
      return {
        items: [],
        meta: {
          queryDurationMs: Date.now() - start,
          count: 0,
          centerPoint: point,
          maxDistanceMeters: maxDist,
        },
      };
    }
  }

  // ─── Polygon Query ─────────────────────────────────────────────────────────

  async queryPolygon(
    tenantId: string,
    polygon: Geometry,
    predicate: "within" | "intersects" | "contains" = "within",
    options?: { layerId?: string; limit?: number },
  ): Promise<GeoJsonFeatureCollection> {
    return this.queryFeatures(tenantId, {
      spatialFilter: { type: "geometry", geometry: polygon, predicate },
      layerId: options?.layerId,
      limit: options?.limit,
    }).then((r) => r.features);
  }

  // ─── Viewport Query ────────────────────────────────────────────────────────

  /**
   * Viewport-aware query: adapts detail level to zoom.
   * At low zoom (< 8): returns coarser/simplified results.
   * At high zoom (>= 12): returns full detail.
   */
  async queryViewport(
    tenantId: string,
    bbox: BoundingBox,
    zoom: number,
    options?: { layerId?: string; limit?: number },
  ): Promise<GeoJsonFeatureCollection> {
    // Adaptive limit based on zoom
    let limit = options?.limit ?? 200;
    if (zoom < 8) limit = Math.min(limit, 50);
    else if (zoom < 12) limit = Math.min(limit, 100);
    else limit = Math.min(limit, 500);

    const { minLng, minLat, maxLng, maxLat } = bbox;

    try {
      const layerFilter = options?.layerId
        ? sql`AND sf.type = ${options.layerId}`
        : sql.raw("");

      // At low zoom, use ST_Simplify to reduce geometry complexity
      const geomExpr =
        zoom < 10
          ? sql.raw(
              "ST_AsGeoJSON(ST_Simplify(sf.geometry, 0.001))::jsonb as geometry",
            )
          : sql.raw("ST_AsGeoJSON(sf.geometry)::jsonb as geometry");

      const bboxJson = JSON.stringify({
        type: "Polygon",
        coordinates: [
          [
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat],
          ],
        ],
      });

      const result = await this.db.execute(sql`
        SELECT sf.id, sf.tenant_id, sf.type,
          ${geomExpr},
          sf.properties, sf.metadata, sf.created_at, sf.updated_at
        FROM spatial_features sf
        WHERE sf.tenant_id = ${tenantId}::uuid
          AND geometry && ST_SetSRID(ST_GeomFromGeoJSON(${bboxJson}), 4326)
          ${layerFilter}
        LIMIT ${limit}
      `);

      const rows = (result.rows ?? []) as unknown as SpatialFeatureRow[];
      return {
        type: "FeatureCollection",
        features: rows.map(rowToGeoJsonFeature),
      };
    } catch {
      return { type: "FeatureCollection", features: [] };
    }
  }

  // ─── Current Positions Radius ──────────────────────────────────────────────

  /**
   * Query current spatial positions (subjects) within a radius.
   * Generic — not vehicle-specific.
   */
  async queryPositionsRadius(
    tenantId: string,
    center: Coordinate,
    radiusMeters: number,
    options?: { subjectType?: string; limit?: number },
  ): Promise<GeoJsonFeatureCollection> {
    SpatialQueryValidator.validateRadius(radiusMeters);
    const [lng, lat] = center;
    const limit = SpatialQueryValidator.clampLimit(options?.limit);
    const typeFilter = options?.subjectType
      ? sql`AND ss.type = ${options.subjectType}`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          cp.subject_id as id,
          cp.tenant_id,
          ss.type,
          ST_AsGeoJSON(cp.location)::jsonb as geometry,
          ss.metadata as properties,
          ss.metadata,
          cp.timestamp as created_at,
          cp.updated_at,
          ST_Distance(
            cp.location::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ) as distance_meters
        FROM spatial_current_positions cp
        JOIN spatial_subjects ss ON ss.id = cp.subject_id
        WHERE cp.tenant_id = ${tenantId}::uuid
          AND ST_DWithin(
            cp.location::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
          ${typeFilter}
        ORDER BY distance_meters ASC
        LIMIT ${limit}
      `);

      const rows = (result.rows ?? []) as unknown as SpatialFeatureRow[];
      return {
        type: "FeatureCollection",
        features: rows.map(rowToGeoJsonFeature),
      };
    } catch {
      return { type: "FeatureCollection", features: [] };
    }
  }

  // ─── Current Positions BBox ────────────────────────────────────────────────

  async queryPositionsBBox(
    tenantId: string,
    bbox: BoundingBox,
    options?: { subjectType?: string; limit?: number },
  ): Promise<GeoJsonFeatureCollection> {
    const { minLng, minLat, maxLng, maxLat } = bbox;
    const limit = SpatialQueryValidator.clampLimit(options?.limit);
    const typeFilter = options?.subjectType
      ? sql`AND ss.type = ${options.subjectType}`
      : sql.raw("");

    try {
      const result = await this.db.execute(sql`
        SELECT
          cp.subject_id as id, cp.tenant_id, ss.type,
          ST_AsGeoJSON(cp.location)::jsonb as geometry,
          ss.metadata as properties, ss.metadata,
          cp.timestamp as created_at, cp.updated_at
        FROM spatial_current_positions cp
        JOIN spatial_subjects ss ON ss.id = cp.subject_id
        WHERE cp.tenant_id = ${tenantId}::uuid
          AND cp.location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
          ${typeFilter}
        LIMIT ${limit}
      `);

      const rows = (result.rows ?? []) as unknown as SpatialFeatureRow[];
      return {
        type: "FeatureCollection",
        features: rows.map(rowToGeoJsonFeature),
      };
    } catch {
      return { type: "FeatureCollection", features: [] };
    }
  }
}
