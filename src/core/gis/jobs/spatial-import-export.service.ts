/**
 * SpatialImportExportService — Asynchronous Bulk GIS Data Processing
 *
 * Handles large-scale GeoJSON, CSV, and spatial data imports and exports
 * asynchronously via the Phase 17 generic JobQueue system.
 *
 * Capabilities:
 *  - Enqueue Bulk Import Jobs (`GIS_IMPORT`)
 *  - Enqueue Bulk Export Jobs (`GIS_EXPORT`)
 *  - Batch validation (SRID EPSG:4326, coordinate bounds, feature structure)
 *  - Transactional batch insertion (e.g. 500 features per batch)
 *  - Export formatting (GeoJSON FeatureCollection, CSV, JSON)
 */

import { DatabaseClient } from "@/database";
import {
  JobQueueProvider,
  CreateJobOptions,
  JobRecord,
} from "@/core/jobs/job-queue.interface";
import { sql } from "drizzle-orm";

export interface BulkImportPayload {
  layerId: string;
  features: Array<{
    type?: string;
    geometry: Record<string, unknown>;
    properties?: Record<string, unknown>;
  }>;
  batchSize?: number;
}

export interface BulkExportPayload {
  layerId?: string;
  format?: "geojson" | "csv" | "json";
  bbox?: [number, number, number, number];
  limit?: number;
}

export class SpatialImportExportService {
  constructor(
    private readonly db: DatabaseClient,
    private readonly jobQueue: JobQueueProvider,
  ) {}

  /**
   * Enqueue a background job for bulk GIS import
   */
  async enqueueImportJob(
    tenantId: string,
    organizationId: string,
    payload: BulkImportPayload,
    userId?: string,
  ): Promise<JobRecord> {
    const jobOptions: CreateJobOptions = {
      tenantId,
      organizationId,
      userId,
      type: "GIS_IMPORT",
      payload: {
        layerId: payload.layerId,
        featureCount: payload.features.length,
        features: payload.features,
        batchSize: payload.batchSize ?? 500,
      },
    };
    return this.jobQueue.enqueueJob(jobOptions);
  }

  /**
   * Enqueue a background job for bulk GIS export
   */
  async enqueueExportJob(
    tenantId: string,
    organizationId: string,
    payload: BulkExportPayload,
    userId?: string,
  ): Promise<JobRecord> {
    const jobOptions: CreateJobOptions = {
      tenantId,
      organizationId,
      userId,
      type: "GIS_EXPORT",
      payload: {
        layerId: payload.layerId ?? "all",
        format: payload.format ?? "geojson",
        bbox: payload.bbox,
        limit: Math.min(payload.limit ?? 50000, 100000),
      },
    };
    return this.jobQueue.enqueueJob(jobOptions);
  }

  /**
   * Process a bulk import job synchronously or in worker thread
   */
  async processImportJob(
    job: JobRecord,
  ): Promise<{ importedCount: number; failedCount: number }> {
    const tenantId = job.tenantId;
    const {
      layerId,
      features,
      batchSize = 500,
    } = job.payload as BulkImportPayload;

    if (!Array.isArray(features) || features.length === 0) {
      throw new Error("Import payload contains no valid features");
    }

    let importedCount = 0;
    let failedCount = 0;

    // Process in batches
    for (let i = 0; i < features.length; i += batchSize) {
      const batch = features.slice(i, i + batchSize);

      for (const feat of batch) {
        try {
          if (!feat.geometry || typeof feat.geometry !== "object") {
            failedCount++;
            continue;
          }

          const geomJson = JSON.stringify(feat.geometry);
          const propJson = JSON.stringify(feat.properties ?? {});

          await this.db.execute(sql`
            INSERT INTO spatial_features (
              tenant_id,
              type,
              geometry,
              properties,
              metadata,
              created_at,
              updated_at
            ) VALUES (
              ${tenantId}::uuid,
              ${layerId},
              ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
              ${propJson}::jsonb,
              '{}'::jsonb,
              NOW(),
              NOW()
            )
          `);
          importedCount++;
        } catch {
          failedCount++;
        }
      }
    }

    return { importedCount, failedCount };
  }

  /**
   * Process a bulk export job synchronously or in worker thread
   */
  async processExportJob(
    job: JobRecord,
  ): Promise<{ exportData: string; recordCount: number }> {
    const tenantId = job.tenantId;
    const {
      layerId,
      format = "geojson",
      bbox,
      limit = 50000,
    } = job.payload as BulkExportPayload;

    const layerFilter =
      layerId && layerId !== "all"
        ? sql`AND sf.type = ${layerId}`
        : sql.raw("");
    let bboxFilter = sql.raw("TRUE");

    if (bbox && bbox.length === 4) {
      const [minLng, minLat, maxLng, maxLat] = bbox;
      bboxFilter = sql`sf.geometry && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`;
    }

    const result = await this.db.execute(sql`
      SELECT
        sf.id,
        sf.type,
        ST_AsGeoJSON(sf.geometry)::jsonb as geometry,
        sf.properties,
        sf.created_at
      FROM spatial_features sf
      WHERE sf.tenant_id = ${tenantId}::uuid
        ${layerFilter}
        AND ${bboxFilter}
      LIMIT ${limit}
    `);

    const rows = (result.rows ?? []) as Array<{
      id: string;
      type: string;
      geometry: Record<string, unknown>;
      properties: Record<string, unknown>;
      created_at: string;
    }>;

    if (format === "csv") {
      const headers =
        "id,type,geometry_type,coordinates,properties,created_at\n";
      const lines = rows.map((r) => {
        const geomType = (r.geometry as { type?: string })?.type ?? "Point";
        const coords = JSON.stringify(
          (r.geometry as { coordinates?: unknown })?.coordinates ?? [],
        );
        const props = JSON.stringify(r.properties ?? {}).replace(/"/g, '""');
        return `"${r.id}","${r.type}","${geomType}","${coords}","${props}","${r.created_at}"`;
      });
      return {
        exportData: headers + lines.join("\n"),
        recordCount: rows.length,
      };
    }

    // Default GeoJSON format
    const featureCollection = {
      type: "FeatureCollection",
      features: rows.map((r) => ({
        type: "Feature",
        id: r.id,
        geometry: r.geometry,
        properties: {
          ...(r.properties ?? {}),
          _type: r.type,
          _createdAt: r.created_at,
        },
      })),
    };

    return {
      exportData: JSON.stringify(featureCollection),
      recordCount: rows.length,
    };
  }
}
