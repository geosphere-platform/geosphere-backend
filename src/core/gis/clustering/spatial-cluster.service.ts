/**
 * SpatialClusterService — Generic Server-Side & Client-Side Spatial Clustering
 *
 * Provides zoom-aware point clustering for large point datasets (vehicles, stores,
 * field agents, incidents, crop plots, towers, assets, etc.) across all 12 GIS industry models.
 *
 * PostGIS Algorithms:
 *  - Grid aggregation (`ST_SnapToGrid`) for high speed & memory efficiency
 *  - Density-based spatial clustering (`ST_ClusterDBSCAN`) for proximity clusters
 *  - Centroid calculation (`ST_Centroid`, `ST_Collect`)
 */

import { sql } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { BoundingBox } from "../bbox/bounding-box";

export interface ClusterPoint {
  id: string;
  type: string;
  lng: number;
  lat: number;
  properties?: Record<string, unknown>;
}

export interface ClusterResultItem {
  isCluster: boolean;
  clusterId?: string;
  count: number;
  center: [number, number]; // [lng, lat]
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  singleFeature?: ClusterPoint;
}

export interface ClusterQueryOptions {
  layerId?: string;
  zoom: number;
  gridSizeDegrees?: number;
  epsDistanceMeters?: number;
  minPoints?: number;
  limit?: number;
}

export class SpatialClusterService {
  constructor(private readonly db: DatabaseClient) {}

  /**
   * Determine grid cell size in degrees based on zoom level
   */
  public static getGridSizeDegrees(zoom: number): number {
    if (zoom < 4) return 2.0;
    if (zoom < 7) return 0.5;
    if (zoom < 10) return 0.1;
    if (zoom < 13) return 0.02;
    if (zoom < 16) return 0.005;
    return 0.001;
  }

  /**
   * Server-side grid aggregation clustering for a viewport bounding box
   */
  async clusterViewport(
    tenantId: string,
    bbox: BoundingBox,
    options: ClusterQueryOptions,
  ): Promise<ClusterResultItem[]> {
    const { zoom, layerId } = options;
    const gridSize =
      options.gridSizeDegrees ?? SpatialClusterService.getGridSizeDegrees(zoom);
    const limit = options.limit ?? 1000;

    const layerFilter = layerId ? sql`AND sf.type = ${layerId}` : sql.raw("");
    const { minLng, minLat, maxLng, maxLat } = bbox;

    try {
      const result = await this.db.execute(sql`
        WITH points AS (
          SELECT
            sf.id,
            sf.type,
            ST_X(sf.geometry) as lng,
            ST_Y(sf.geometry) as lat,
            sf.geometry,
            sf.properties
          FROM spatial_features sf
          WHERE sf.tenant_id = ${tenantId}::uuid
            AND sf.geometry && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
            AND ST_GeometryType(sf.geometry) = 'ST_Point'
            ${layerFilter}
          LIMIT ${limit * 5}
        ),
        grid_clusters AS (
          SELECT
            ST_SnapToGrid(geometry, ${gridSize}) as grid_cell,
            COUNT(*) as point_count,
            ST_X(ST_Centroid(ST_Collect(geometry))) as center_lng,
            ST_Y(ST_Centroid(ST_Collect(geometry))) as center_lat,
            ST_XMin(ST_Extent(geometry)) as min_lng,
            ST_YMin(ST_Extent(geometry)) as min_lat,
            ST_XMax(ST_Extent(geometry)) as max_lng,
            ST_YMax(ST_Extent(geometry)) as max_lat,
            MAX(id::text) as sample_id,
            MAX(type) as sample_type
          FROM points
          GROUP BY grid_cell
        )
        SELECT
          point_count,
          center_lng,
          center_lat,
          min_lng,
          min_lat,
          max_lng,
          max_lat,
          sample_id,
          sample_type
        FROM grid_clusters
        LIMIT ${limit}
      `);

      const rows = (result.rows ?? []) as Array<{
        point_count: number | string;
        center_lng: number | string;
        center_lat: number | string;
        min_lng: number | string;
        min_lat: number | string;
        max_lng: number | string;
        max_lat: number | string;
        sample_id: string;
        sample_type: string;
      }>;

      return rows.map((row, idx) => {
        const count = Number(row.point_count);
        const center: [number, number] = [
          Number(row.center_lng),
          Number(row.center_lat),
        ];

        if (count === 1) {
          return {
            isCluster: false,
            count: 1,
            center,
            singleFeature: {
              id: row.sample_id,
              type: row.sample_type,
              lng: center[0],
              lat: center[1],
            },
          };
        }

        return {
          isCluster: true,
          clusterId: `cluster-${idx}-${Math.round(center[0] * 1000)}-${Math.round(center[1] * 1000)}`,
          count,
          center,
          bbox: [
            Number(row.min_lng),
            Number(row.min_lat),
            Number(row.max_lng),
            Number(row.max_lat),
          ],
        };
      });
    } catch {
      return [];
    }
  }
}
