/**
 * Spatial Query Validator
 *
 * Validates the entire SpatialQuery model BEFORE any PostGIS query is built.
 * Enforces:
 *  - Filter field whitelist (no arbitrary column names)
 *  - Operator whitelist (no raw SQL operators)
 *  - Maximum nesting depth
 *  - Maximum filter count
 *  - Time range limits
 *  - Radius limits
 *  - Polygon vertex limits
 *  - Limit/pagination enforcement
 *
 * Security: This validator is the FIRST line of defence against query injection.
 * No client-submitted field name or operator may bypass validation.
 */

import { SPATIAL_QUERY_LIMITS } from "./query-limits.config";
import {
  SpatialQuery,
  FilterGroup,
  AttributeFilter,
  FilterOperator,
  SpatialFilter,
  TemporalFilter,
  SortField,
} from "./spatial-query.model";
import {
  InvalidFilterError,
  InvalidTimeRangeError,
  SpatialQueryTooComplexError,
  QueryLimitExceededError,
  InvalidRadiusError,
  InvalidGeometryError,
} from "../../errors/spatial-errors";
import { validateBBox } from "../validation/spatial-validation";

// ─── Whitelisted Fields ───────────────────────────────────────────────────────

/**
 * Fields that clients are permitted to filter on in attribute filters.
 * This whitelist prevents arbitrary SQL column injection.
 */
export const WHITELISTED_FILTER_FIELDS = new Set([
  // Spatial feature fields
  "type",
  "name",
  "externalId",
  "status",
  "category",
  "source",
  "active",
  "priority",
  "description",
  "layerId",
  "zoneType",
  "featureType",

  // Temporal fields
  "createdAt",
  "updatedAt",
  "timestamp",

  // Subject fields
  "subjectId",
  "subjectType",

  // Numeric/measurement fields
  "speed",
  "heading",
  "accuracy",
  "altitude",

  // Generic property fields (accessed via properties JSONB)
  "properties.status",
  "properties.type",
  "properties.name",
  "properties.category",
  "properties.priority",
  "properties.value",
  "properties.score",
  "properties.active",
  "properties.zoneType",
  "properties.featureType",
  "properties.externalId",
  "properties.description",
]);

/**
 * Fields allowed for sorting.
 */
const WHITELISTED_SORT_FIELDS: Set<SortField> = new Set([
  "timestamp",
  "distance",
  "name",
  "createdAt",
  "updatedAt",
  "area",
  "length",
]);

/**
 * Allowed filter operators — maps to safe SQL expressions only.
 */
const WHITELISTED_OPERATORS = new Set<FilterOperator>([
  "equals",
  "notEquals",
  "contains",
  "startsWith",
  "endsWith",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
  "in",
  "notIn",
  "isNull",
  "isNotNull",
]);

// ─── Validator ────────────────────────────────────────────────────────────────

export class SpatialQueryValidator {
  /**
   * Validate and normalize the complete SpatialQuery object.
   * Throws a typed error if any constraint is violated.
   */
  static validate(
    query: SpatialQuery,
    allowedFields?: Set<string>,
  ): SpatialQuery {
    const fieldWhitelist = allowedFields ?? WHITELISTED_FILTER_FIELDS;

    // 1. Validate filters
    if (query.filters) {
      const filterCount = this.countFilters(query.filters);
      if (filterCount > SPATIAL_QUERY_LIMITS.MAX_FILTERS) {
        throw new SpatialQueryTooComplexError(
          `Query contains ${filterCount} filters, exceeding the maximum of ${SPATIAL_QUERY_LIMITS.MAX_FILTERS}`,
        );
      }
      this.validateFilterNode(query.filters, 0, fieldWhitelist);
    }

    // 2. Validate spatial filter
    if (query.spatialFilter) {
      this.validateSpatialFilter(query.spatialFilter);
    }

    // 3. Validate temporal filter
    if (query.temporalFilter) {
      this.validateTemporalFilter(query.temporalFilter, fieldWhitelist);
    }

    // 4. Validate sort
    if (query.sort) {
      if (!WHITELISTED_SORT_FIELDS.has(query.sort.field)) {
        throw new InvalidFilterError(
          `Sort field '${query.sort.field}' is not permitted. Allowed: ${[...WHITELISTED_SORT_FIELDS].join(", ")}`,
        );
      }
      if (query.sort.order !== "asc" && query.sort.order !== "desc") {
        throw new InvalidFilterError("Sort order must be 'asc' or 'desc'");
      }
    }

    // 5. Validate pagination / limit
    const rawLimit = query.limit ?? query.pagination?.limit;
    if (rawLimit !== undefined) {
      if (
        typeof rawLimit !== "number" ||
        rawLimit <= 0 ||
        !Number.isInteger(rawLimit)
      ) {
        throw new QueryLimitExceededError(`Limit must be a positive integer`);
      }
      if (rawLimit > SPATIAL_QUERY_LIMITS.MAX_RESULT_LIMIT) {
        throw new QueryLimitExceededError(
          `Requested limit ${rawLimit} exceeds maximum of ${SPATIAL_QUERY_LIMITS.MAX_RESULT_LIMIT}`,
        );
      }
    }

    // 6. Validate searchText — disallow SQL injection characters
    if (query.searchText !== undefined) {
      if (typeof query.searchText !== "string") {
        throw new InvalidFilterError("searchText must be a string");
      }
      if (query.searchText.length > 200) {
        throw new InvalidFilterError(
          "searchText exceeds maximum length of 200 characters",
        );
      }
      // Strip and reject patterns that look like SQL
      if (/[;'"\-\-\/\*]/.test(query.searchText)) {
        throw new InvalidFilterError(
          "searchText contains disallowed characters",
        );
      }
    }

    return query;
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private static validateFilterNode(
    node: FilterGroup | AttributeFilter | AttributeFilter[],
    depth: number,
    whitelist: Set<string>,
  ): void {
    if (depth > SPATIAL_QUERY_LIMITS.MAX_NESTING_DEPTH) {
      throw new SpatialQueryTooComplexError(
        `Filter nesting depth ${depth} exceeds maximum of ${SPATIAL_QUERY_LIMITS.MAX_NESTING_DEPTH}`,
      );
    }

    // Flat array shorthand
    if (Array.isArray(node)) {
      for (const f of node) {
        this.validateAttributeFilter(f, whitelist);
      }
      return;
    }

    // FilterGroup
    if ("connector" in node) {
      const group = node as FilterGroup;
      if (group.connector !== "AND" && group.connector !== "OR") {
        throw new InvalidFilterError(
          `Invalid connector '${group.connector}'. Must be AND or OR`,
        );
      }
      for (const child of group.filters) {
        this.validateFilterNode(
          child as FilterGroup | AttributeFilter,
          depth + 1,
          whitelist,
        );
      }
      return;
    }

    // Single AttributeFilter
    this.validateAttributeFilter(node as AttributeFilter, whitelist);
  }

  private static validateAttributeFilter(
    filter: AttributeFilter,
    whitelist: Set<string>,
  ): void {
    // Field whitelist check
    if (!whitelist.has(filter.field)) {
      throw new InvalidFilterError(
        `Filter field '${filter.field}' is not permitted. Submit a valid whitelisted field.`,
      );
    }

    // Operator whitelist check
    if (!WHITELISTED_OPERATORS.has(filter.operator)) {
      throw new InvalidFilterError(
        `Filter operator '${filter.operator}' is not permitted.`,
      );
    }

    // Value requirements
    if (filter.operator === "in" || filter.operator === "notIn") {
      if (!Array.isArray(filter.values) || filter.values.length === 0) {
        throw new InvalidFilterError(
          `Operator '${filter.operator}' requires a non-empty 'values' array`,
        );
      }
      if (filter.values.length > 100) {
        throw new InvalidFilterError(
          `Operator '${filter.operator}' values array exceeds limit of 100`,
        );
      }
    }

    if (filter.operator !== "isNull" && filter.operator !== "isNotNull") {
      if (filter.operator !== "in" && filter.operator !== "notIn") {
        if (filter.value === undefined && filter.values === undefined) {
          throw new InvalidFilterError(
            `Filter on field '${filter.field}' with operator '${filter.operator}' requires a value`,
          );
        }
      }
    }

    // Prevent string injection in filter values
    if (typeof filter.value === "string") {
      if (filter.value.length > 500) {
        throw new InvalidFilterError(
          `Filter value for field '${filter.field}' exceeds maximum length`,
        );
      }
    }
  }

  private static validateSpatialFilter(spatialFilter: SpatialFilter): void {
    if (spatialFilter.type === "bbox") {
      validateBBox(
        spatialFilter.minLng,
        spatialFilter.minLat,
        spatialFilter.maxLng,
        spatialFilter.maxLat,
      );
    } else if (spatialFilter.type === "radius") {
      const { center, radiusMeters } = spatialFilter;
      if (!Array.isArray(center) || center.length < 2) {
        throw new InvalidFilterError(
          "Radius filter requires a valid center coordinate [lng, lat]",
        );
      }
      const [lng, lat] = center;
      if (typeof lng !== "number" || typeof lat !== "number") {
        throw new InvalidFilterError(
          "Radius filter center coordinates must be numbers",
        );
      }
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new InvalidFilterError(
          "Radius filter center coordinates are out of bounds",
        );
      }
      if (typeof radiusMeters !== "number" || radiusMeters <= 0) {
        throw new InvalidRadiusError(
          "Radius must be a positive number in meters",
        );
      }
      if (radiusMeters > SPATIAL_QUERY_LIMITS.MAX_RADIUS_METERS) {
        throw new InvalidRadiusError(
          `Radius ${radiusMeters}m exceeds maximum allowed ${SPATIAL_QUERY_LIMITS.MAX_RADIUS_METERS}m (${SPATIAL_QUERY_LIMITS.MAX_RADIUS_METERS / 1000} km)`,
        );
      }
    } else if (spatialFilter.type === "geometry") {
      const { geometry } = spatialFilter;
      if (!geometry || !geometry.type || !geometry.coordinates) {
        throw new InvalidGeometryError(
          "Geometry filter requires a valid GeoJSON geometry object",
        );
      }
      // Count vertices for polygon complexity check
      if (geometry.type === "Polygon") {
        const totalVertices = (geometry.coordinates as unknown[][]).reduce(
          (acc, ring) => acc + (ring as unknown[]).length,
          0,
        );
        if (totalVertices > SPATIAL_QUERY_LIMITS.MAX_POLYGON_VERTICES) {
          throw new SpatialQueryTooComplexError(
            `Polygon has ${totalVertices} vertices, exceeding maximum of ${SPATIAL_QUERY_LIMITS.MAX_POLYGON_VERTICES}`,
          );
        }
      }
      if (geometry.type === "MultiPolygon") {
        const totalVertices = (geometry.coordinates as unknown[][][]).reduce(
          (acc, poly) =>
            acc + poly.reduce((a, ring) => a + (ring as unknown[]).length, 0),
          0,
        );
        if (totalVertices > SPATIAL_QUERY_LIMITS.MAX_POLYGON_VERTICES) {
          throw new SpatialQueryTooComplexError(
            `MultiPolygon has ${totalVertices} vertices, exceeding maximum of ${SPATIAL_QUERY_LIMITS.MAX_POLYGON_VERTICES}`,
          );
        }
      }
    }
  }

  private static validateTemporalFilter(
    temporal: TemporalFilter,
    whitelist: Set<string>,
  ): void {
    if (temporal.field && !whitelist.has(temporal.field)) {
      throw new InvalidFilterError(
        `Temporal filter field '${temporal.field}' is not permitted`,
      );
    }

    if (temporal.from && temporal.to) {
      const fromMs = new Date(temporal.from).getTime();
      const toMs = new Date(temporal.to).getTime();

      if (isNaN(fromMs)) {
        throw new InvalidTimeRangeError(
          `Temporal 'from' timestamp is invalid: ${temporal.from}`,
        );
      }
      if (isNaN(toMs)) {
        throw new InvalidTimeRangeError(
          `Temporal 'to' timestamp is invalid: ${temporal.to}`,
        );
      }
      if (fromMs > toMs) {
        throw new InvalidTimeRangeError(
          "Temporal 'from' must be before or equal to 'to'",
        );
      }

      const rangeDays = (toMs - fromMs) / (1000 * 60 * 60 * 24);
      if (rangeDays > SPATIAL_QUERY_LIMITS.MAX_TIME_RANGE_DAYS) {
        throw new InvalidTimeRangeError(
          `Time range of ${Math.ceil(rangeDays)} days exceeds maximum of ${SPATIAL_QUERY_LIMITS.MAX_TIME_RANGE_DAYS} days`,
        );
      }
    } else if (temporal.from) {
      if (isNaN(new Date(temporal.from).getTime())) {
        throw new InvalidTimeRangeError(
          `Temporal 'from' timestamp is invalid: ${temporal.from}`,
        );
      }
    } else if (temporal.to) {
      if (isNaN(new Date(temporal.to).getTime())) {
        throw new InvalidTimeRangeError(
          `Temporal 'to' timestamp is invalid: ${temporal.to}`,
        );
      }
    }
  }

  private static countFilters(
    node: FilterGroup | AttributeFilter | AttributeFilter[],
  ): number {
    if (Array.isArray(node)) {
      return node.length;
    }
    if ("connector" in node) {
      return node.filters.reduce(
        (acc, child) =>
          acc + this.countFilters(child as FilterGroup | AttributeFilter),
        0,
      );
    }
    return 1;
  }

  // ─── Standalone Validators ─────────────────────────────────────────────────

  static validateTimeRange(from: string, to: string): void {
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();

    if (isNaN(fromMs))
      throw new InvalidTimeRangeError(`Invalid 'from' timestamp: ${from}`);
    if (isNaN(toMs))
      throw new InvalidTimeRangeError(`Invalid 'to' timestamp: ${to}`);
    if (fromMs > toMs)
      throw new InvalidTimeRangeError("'from' must be before 'to'");

    const rangeDays = (toMs - fromMs) / (1000 * 60 * 60 * 24);
    if (rangeDays > SPATIAL_QUERY_LIMITS.MAX_TIME_RANGE_DAYS) {
      throw new InvalidTimeRangeError(
        `Time range of ${Math.ceil(rangeDays)} days exceeds maximum of ${SPATIAL_QUERY_LIMITS.MAX_TIME_RANGE_DAYS} days`,
      );
    }
  }

  static validateRadius(radiusMeters: number): void {
    if (typeof radiusMeters !== "number" || radiusMeters <= 0) {
      throw new InvalidRadiusError(
        "Radius must be a positive number in meters",
      );
    }
    if (radiusMeters > SPATIAL_QUERY_LIMITS.MAX_RADIUS_METERS) {
      throw new InvalidRadiusError(
        `Radius ${radiusMeters}m exceeds maximum ${SPATIAL_QUERY_LIMITS.MAX_RADIUS_METERS}m`,
      );
    }
  }

  static validateNearestN(n: number): void {
    if (typeof n !== "number" || n <= 0 || !Number.isInteger(n)) {
      throw new QueryLimitExceededError("Nearest N must be a positive integer");
    }
    if (n > SPATIAL_QUERY_LIMITS.MAX_NEAREST_N) {
      throw new QueryLimitExceededError(
        `Nearest N=${n} exceeds maximum of ${SPATIAL_QUERY_LIMITS.MAX_NEAREST_N}`,
      );
    }
  }

  static clampLimit(limit?: number): number {
    if (!limit || limit <= 0) return SPATIAL_QUERY_LIMITS.DEFAULT_RESULT_LIMIT;
    return Math.min(limit, SPATIAL_QUERY_LIMITS.MAX_RESULT_LIMIT);
  }
}
