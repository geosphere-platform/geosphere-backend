/**
 * Shared API singleton dependencies for the Phase 10
 * GIS Query, Search & Spatial Analytics Engine.
 *
 * Services are instantiated once and shared across all route handlers.
 * All services receive the same database client.
 */

import { db } from "@/database";
import { SpatialQueryService } from "@/core/gis/query/spatial-query.service";
import { SpatialSearchService } from "@/core/gis/query/spatial-search.service";
import { SpatialHistoryService } from "@/core/gis/query/spatial-history.service";
import { SpatialAggregationService } from "@/core/gis/query/spatial-aggregation.service";
import { SpatialAnalyticsService } from "@/core/gis/query/spatial-analytics.service";
import { SpatialStatisticsService } from "@/core/gis/query/spatial-statistics.service";

export const spatialQueryService = new SpatialQueryService(db);
export const spatialSearchService = new SpatialSearchService(db);
export const spatialHistoryService = new SpatialHistoryService(db);
export const spatialAggregationService = new SpatialAggregationService(db);
export const spatialAnalyticsService = new SpatialAnalyticsService(db);
export const spatialStatisticsService = new SpatialStatisticsService(db);
