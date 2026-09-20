/**
 * AnalyticsExportService — Export Abstraction
 *
 * Provides an abstraction for future CSV / GeoJSON / Excel export.
 * Phase 10 implements JSON export only.
 *
 * Design notes:
 *  - Structured for future async job consumption (no Redis required now)
 *  - Future large exports should use a job queue system
 *  - No synchronous large exports (would block the process)
 *  - Only formats that fit the current architecture are implemented
 */

import { AnalyticsResult } from "./analytics-result.model";

export type ExportFormat = "json" | "csv" | "geojson";

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
}

export interface ExportResult {
  format: ExportFormat;
  content: string;
  filename: string;
  sizeBytes: number;
  rowCount: number;
  generatedAt: string;
}

export class AnalyticsExportService {
  /**
   * Export an AnalyticsResult to the requested format.
   * Phase 10: only JSON is implemented.
   * Future: CSV, GeoJSON will be added as async jobs.
   */
  static export<T>(
    result: AnalyticsResult<T>,
    options: ExportOptions = { format: "json" },
  ): ExportResult {
    const generatedAt = new Date().toISOString();
    const filename = options.filename ?? `analytics_export_${Date.now()}`;

    switch (options.format) {
      case "json":
        return this.exportJson(
          result,
          filename,
          generatedAt,
          options.includeMetadata ?? true,
        );

      case "csv":
        return this.exportCsv(result, filename, generatedAt);

      case "geojson":
        return this.exportGeoJson(result, filename, generatedAt);

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static exportJson<T>(
    result: AnalyticsResult<T>,
    filename: string,
    generatedAt: string,
    includeMetadata: boolean,
  ): ExportResult {
    const output = includeMetadata
      ? result
      : { rows: result.rows, summary: result.summary };
    const content = JSON.stringify(output, null, 2);
    return {
      format: "json",
      content,
      filename: `${filename}.json`,
      sizeBytes: Buffer.byteLength(content, "utf8"),
      rowCount: result.rows.length,
      generatedAt,
    };
  }

  private static exportCsv<T>(
    result: AnalyticsResult<T>,
    filename: string,
    generatedAt: string,
  ): ExportResult {
    if (result.rows.length === 0) {
      return {
        format: "csv",
        content: "",
        filename: `${filename}.csv`,
        sizeBytes: 0,
        rowCount: 0,
        generatedAt,
      };
    }

    // Auto-detect headers from first row
    const firstRow = result.rows[0] as Record<string, unknown>;
    const headers = Object.keys(firstRow).filter(
      (k) => typeof firstRow[k] !== "object" || firstRow[k] === null,
    );
    const headerLine = headers.map((h) => `"${h}"`).join(",");

    const dataLines = result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return headers
        .map((h) => {
          const v = r[h];
          if (v === null || v === undefined) return "";
          if (typeof v === "string") return `"${v.replace(/"/g, '""')}"`;
          return String(v);
        })
        .join(",");
    });

    const content = [headerLine, ...dataLines].join("\n");
    return {
      format: "csv",
      content,
      filename: `${filename}.csv`,
      sizeBytes: Buffer.byteLength(content, "utf8"),
      rowCount: result.rows.length,
      generatedAt,
    };
  }

  private static exportGeoJson<T>(
    result: AnalyticsResult<T>,
    filename: string,
    generatedAt: string,
  ): ExportResult {
    // Attempt to extract geometry from rows
    const features = result.rows.map((row, i) => {
      const r = row as Record<string, unknown>;
      const geometry = r.geometry ?? r.geom ?? null;
      const { geometry: _g, geom: _geom, ...props } = r;
      return {
        type: "Feature",
        id: r.id ?? i,
        geometry,
        properties: props,
      };
    });

    const collection = { type: "FeatureCollection", features };
    const content = JSON.stringify(collection, null, 2);
    return {
      format: "geojson",
      content,
      filename: `${filename}.geojson`,
      sizeBytes: Buffer.byteLength(content, "utf8"),
      rowCount: result.rows.length,
      generatedAt,
    };
  }
}
