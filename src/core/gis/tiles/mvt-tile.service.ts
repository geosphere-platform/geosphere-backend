/**
 * MVT Tile Service — PostGIS Vector Tile Engine (Mapbox Vector Tile format)
 *
 * Generates binary `.pbf` Mapbox Vector Tiles directly inside PostGIS using:
 *  - `ST_TileEnvelope(z, x, y)` for Web Mercator EPSG:3857 tile bounding box calculation
 *  - `ST_Transform(geometry, 3857)` for coordinate transformation
 *  - `ST_SimplifyPreserveTopology()` for zoom-aware geometry reduction
 *  - `ST_AsMVTGeom()` for coordinate clipping and quantization
 *  - `ST_AsMVT()` for binary Protocol Buffer aggregation
 *
 * Enforces strict multi-tenant security (`tenant_id`), layer scope, property minimization,
 * and parameterized SQL execution.
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { tileCacheProvider } from "./tile-cache.provider";

export interface TileRequestOptions {
  layerId: string;
  z: number;
  x: number;
  y: number;
  properties?: string[];
  simplifyTolerance?: number;
}

export interface MvtResult {
  buffer: Buffer;
  etag: string;
  isCached: boolean;
  featureCount: number;
}

export class MvtTileService {
  constructor(private readonly db: DatabaseClient) {}

  /**
   * Calculate bounding box in Web Mercator (EPSG:3857) for tile (z, x, y)
   */
  public static tileToBBox3857(
    z: number,
    x: number,
    y: number,
  ): [number, number, number, number] {
    const worldSize = 40075016.68557849;
    const tileSize = worldSize / Math.pow(2, z);
    const minX = -20037508.342789244 + x * tileSize;
    const maxX = -20037508.342789244 + (x + 1) * tileSize;
    const maxY = 20037508.342789244 - y * tileSize;
    const minY = 20037508.342789244 - (y + 1) * tileSize;
    return [minX, minY, maxX, maxY];
  }

  /**
   * Determine dynamic geometry simplification tolerance based on zoom level.
   * Lower zoom levels get higher tolerance (coarser geometries).
   */
  public static getSimplificationTolerance(zoom: number): number {
    if (zoom < 6) return 0.05; // Low zoom: high simplification
    if (zoom < 9) return 0.01; // Medium-low zoom
    if (zoom < 12) return 0.002; // Medium zoom
    if (zoom < 15) return 0.0005; // Medium-high zoom
    return 0; // High zoom: full fidelity
  }

  /**
   * Generate binary Mapbox Vector Tile (.pbf) for a given tenant, layer, and tile coordinates.
   */
  async generateTile(
    tenantId: string,
    options: TileRequestOptions,
  ): Promise<MvtResult> {
    const { layerId, z, x, y } = options;
    const cacheKey = `mvt:${tenantId}:${layerId}:${z}:${x}:${y}`;

    // Check cache
    const cached = tileCacheProvider.get(cacheKey);
    if (cached) {
      return {
        buffer: cached.buffer,
        etag: cached.etag,
        isCached: true,
        featureCount: 0,
      };
    }

    const tolerance =
      options.simplifyTolerance ?? MvtTileService.getSimplificationTolerance(z);
    const layerName = layerId || "default";

    try {
      // Dynamic simplify expression
      const geomExpr =
        tolerance > 0
          ? sql.raw(`ST_SimplifyPreserveTopology(sf.geometry, ${tolerance})`)
          : sql.raw("sf.geometry");

      // Query PostGIS MVT
      const result = await this.db.execute(sql`
        WITH tile_bounds AS (
          SELECT ST_TileEnvelope(${z}, ${x}, ${y}) AS bbox
        ),
        mvt_geom AS (
          SELECT
            sf.id,
            sf.properties->>'name' as name,
            sf.properties->>'status' as status,
            sf.properties->>'category' as category,
            ST_AsMVTGeom(
              ST_Transform(${geomExpr}, 3857),
              tb.bbox,
              4096,
              256,
              true
            ) AS geom
          FROM spatial_features sf, tile_bounds tb
          WHERE sf.tenant_id = ${tenantId}::uuid
            AND sf.type = ${layerId}
            AND sf.geometry && ST_Transform(tb.bbox, 4326)
        )
        SELECT ST_AsMVT(mvt_geom, ${layerName}, 4096, 'geom') AS mvt
        FROM mvt_geom;
      `);

      const rawRow = result.rows?.[0] as { mvt?: string | Buffer } | undefined;
      let buffer: Buffer;

      if (!rawRow?.mvt) {
        buffer = Buffer.alloc(0);
      } else if (Buffer.isBuffer(rawRow.mvt)) {
        buffer = rawRow.mvt;
      } else if (typeof rawRow.mvt === "string") {
        buffer = Buffer.from(rawRow.mvt, "hex");
      } else {
        buffer = Buffer.alloc(0);
      }

      const cachedEntry = tileCacheProvider.set(cacheKey, buffer, 300);

      return {
        buffer,
        etag: cachedEntry.etag,
        isCached: false,
        featureCount: buffer.length > 0 ? 1 : 0,
      };
    } catch {
      // Fallback empty tile on offline / DB error
      const emptyBuf = Buffer.alloc(0);
      const etag = tileCacheProvider.generateETag(emptyBuf);
      return { buffer: emptyBuf, etag, isCached: false, featureCount: 0 };
    }
  }
}
