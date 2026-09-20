/**
 * Generic Analytics Result Model
 *
 * Dashboard-ready analytics output suitable for React dashboards,
 * mobile clients, customer portals, reports, and SDK consumers.
 * Decoupled from any specific business domain.
 */

// ─── Generic Analytics Result ─────────────────────────────────────────────────

export interface AnalyticsMetadata {
  queryType: string;
  tenantId: string;
  queryDurationMs: number;
  generatedAt: string; // ISO 8601 UTC
  from?: string;
  to?: string;
  filtersApplied: number;
  dataQualityNotes: string[];
}

export interface AnalyticsDimension {
  name: string;
  type: "string" | "number" | "timestamp" | "geometry";
  description?: string;
}

export interface AnalyticsMetric {
  name: string;
  type: "count" | "sum" | "avg" | "min" | "max" | "ratio" | "duration";
  unit?: string;
  description?: string;
}

export interface AnalyticsPagination {
  total: number;
  returned: number;
  limit: number;
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Generic analytics result container.
 * T = row type (e.g. TimeSeriesPoint, ZoneCount, EventCount)
 */
export interface AnalyticsResult<T = Record<string, unknown>> {
  metadata: AnalyticsMetadata;
  dimensions: AnalyticsDimension[];
  metrics: AnalyticsMetric[];
  rows: T[];
  summary: Record<string, number | string | null>;
  pagination?: AnalyticsPagination;
}

// ─── Factory Helpers ──────────────────────────────────────────────────────────

export function createAnalyticsResult<T>(params: {
  queryType: string;
  tenantId: string;
  queryDurationMs: number;
  from?: string;
  to?: string;
  filtersApplied?: number;
  dataQualityNotes?: string[];
  dimensions?: AnalyticsDimension[];
  metrics?: AnalyticsMetric[];
  rows: T[];
  summary: Record<string, number | string | null>;
  pagination?: AnalyticsPagination;
}): AnalyticsResult<T> {
  return {
    metadata: {
      queryType: params.queryType,
      tenantId: params.tenantId,
      queryDurationMs: params.queryDurationMs,
      generatedAt: new Date().toISOString(),
      from: params.from,
      to: params.to,
      filtersApplied: params.filtersApplied ?? 0,
      dataQualityNotes: params.dataQualityNotes ?? [],
    },
    dimensions: params.dimensions ?? [],
    metrics: params.metrics ?? [],
    rows: params.rows,
    summary: params.summary,
    pagination: params.pagination,
  };
}
