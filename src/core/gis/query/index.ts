/**
 * GIS Query Engine — Public Exports
 *
 * Business modules may consume these services without knowing PostGIS,
 * SQL, or database schema details.
 *
 * Example usage:
 *
 * Logistics module:
 *   spatialQueryService.queryRadius(tenantId, location, 5000)
 *
 * Agriculture module:
 *   spatialQueryService.queryPolygon(tenantId, fieldPolygon)
 *
 * Utility module:
 *   spatialQueryService.queryFeatures(tenantId, { spatialFilter: { type: 'geometry', geometry: pipeline, predicate: 'intersects' } })
 *
 * Workforce module:
 *   spatialHistoryService.getHistory(tenantId, subjectId, options)
 *
 * Vehicle / movement module:
 *   spatialHistoryService.getTrack(tenantId, subjectId, from, to)
 */

export * from "./query-limits.config";
export * from "./spatial-query.model";
export * from "./analytics-result.model";
export * from "./spatial-query-validator";
export * from "./spatial-filter-processor";
export * from "./spatial-query.service";
export * from "./spatial-search.service";
export * from "./spatial-history.service";
export * from "./spatial-aggregation.service";
export * from "./spatial-analytics.service";
export * from "./spatial-statistics.service";
export * from "./analytics-export.service";
