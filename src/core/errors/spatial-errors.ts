/**
 * Spatial Domain Errors
 *
 * Standardized domain exception classes for generic spatial operations,
 * PostGIS query failures, geometry validation, boundary enforcement, and authorization.
 */

import { AppError } from "./errors";

export class SpatialFeatureNotFoundError extends AppError {
  constructor(featureId: string) {
    super(
      `Spatial feature '${featureId}' not found`,
      404,
      "SPATIAL_FEATURE_NOT_FOUND",
    );
    this.name = "SpatialFeatureNotFoundError";
  }
}

export class InvalidGeometryError extends AppError {
  constructor(message: string = "Invalid geometry provided") {
    super(message, 400, "INVALID_GEOMETRY");
    this.name = "InvalidGeometryError";
  }
}

export class UnsupportedGeometryTypeError extends AppError {
  constructor(type: string) {
    super(
      `Unsupported geometry type '${type}'`,
      400,
      "UNSUPPORTED_GEOMETRY_TYPE",
    );
    this.name = "UnsupportedGeometryTypeError";
  }
}

export class InvalidCoordinateError extends AppError {
  constructor(message: string = "Invalid geographic coordinate") {
    super(message, 400, "INVALID_COORDINATES");
    this.name = "InvalidCoordinateError";
  }
}

export class InvalidDistanceError extends AppError {
  constructor(message: string = "Invalid distance value") {
    super(message, 400, "INVALID_DISTANCE");
    this.name = "InvalidDistanceError";
  }
}

export class InvalidBBoxError extends AppError {
  constructor(message: string = "Invalid bounding box parameters") {
    super(message, 400, "INVALID_BBOX");
    this.name = "InvalidBBoxError";
  }
}

export class InvalidRadiusError extends AppError {
  constructor(message: string = "Invalid radius search parameter") {
    super(message, 400, "INVALID_RADIUS");
    this.name = "InvalidRadiusError";
  }
}

export class InvalidBufferError extends AppError {
  constructor(message: string = "Invalid buffer parameters") {
    super(message, 400, "INVALID_BUFFER");
    this.name = "InvalidBufferError";
  }
}

export class SpatialQueryTooLargeError extends AppError {
  constructor(
    message: string = "Requested spatial query area or radius exceeds platform limit",
  ) {
    super(message, 400, "SPATIAL_QUERY_TOO_LARGE");
    this.name = "SpatialQueryTooLargeError";
  }
}

export class SpatialOperationTooLargeError extends AppError {
  constructor(
    message: string = "Spatial operation payload or candidate set exceeds maximum safety limit",
  ) {
    super(message, 400, "SPATIAL_OPERATION_TOO_LARGE");
    this.name = "SpatialOperationTooLargeError";
  }
}

export class SpatialResultLimitExceededError extends AppError {
  constructor(maxLimit: number = 500) {
    super(
      `Result limit exceeds maximum allowed limit of ${maxLimit}`,
      400,
      "SPATIAL_QUERY_LIMIT_EXCEEDED",
    );
    this.name = "SpatialResultLimitExceededError";
  }
}

export class GeofenceNotFoundError extends AppError {
  constructor(geofenceId: string) {
    super(
      `Geofence boundary '${geofenceId}' not found`,
      404,
      "GEOFENCE_NOT_FOUND",
    );
    this.name = "GeofenceNotFoundError";
  }
}

export class GeofenceEvaluationFailedError extends AppError {
  constructor(message: string = "Geofence evaluation failed") {
    super(message, 500, "GEOFENCE_EVALUATION_FAILED");
    this.name = "GeofenceEvaluationFailedError";
  }
}

export class UnauthorizedSpatialAccessError extends AppError {
  constructor(message: string = "Unauthorized spatial feature access") {
    super(message, 403, "UNAUTHORIZED_SPATIAL_OPERATION");
    this.name = "UnauthorizedSpatialAccessError";
  }
}

export class UnauthorizedSpatialOperationError extends AppError {
  constructor(message: string = "Unauthorized spatial operation execution") {
    super(message, 403, "UNAUTHORIZED_SPATIAL_OPERATION");
    this.name = "UnauthorizedSpatialOperationError";
  }
}

export class TenantAccessDeniedError extends AppError {
  constructor(message: string = "Tenant spatial access denied") {
    super(message, 403, "TENANT_ACCESS_DENIED");
    this.name = "TenantAccessDeniedError";
  }
}

export class InvalidLocationError extends AppError {
  constructor(message: string = "Invalid location update payload") {
    super(message, 400, "INVALID_LOCATION");
    this.name = "InvalidLocationError";
  }
}

export class InvalidTimestampError extends AppError {
  constructor(message: string = "Invalid or skewed location timestamp") {
    super(message, 400, "INVALID_TIMESTAMP");
    this.name = "InvalidTimestampError";
  }
}

export class SubjectNotFoundError extends AppError {
  constructor(subjectId: string) {
    super(`Spatial subject '${subjectId}' not found`, 404, "SUBJECT_NOT_FOUND");
    this.name = "SubjectNotFoundError";
  }
}

export class SubjectAccessDeniedError extends AppError {
  constructor(message: string = "Access to spatial subject denied") {
    super(message, 403, "SUBJECT_ACCESS_DENIED");
    this.name = "SubjectAccessDeniedError";
  }
}

export class DuplicateLocationError extends AppError {
  constructor(message: string = "Duplicate location update detected") {
    super(message, 409, "DUPLICATE_LOCATION");
    this.name = "DuplicateLocationError";
  }
}

export class StaleLocationError extends AppError {
  constructor(
    message: string = "Location update is older than current position timestamp",
  ) {
    super(message, 422, "STALE_LOCATION");
    this.name = "StaleLocationError";
  }
}

export class BatchSizeExceededError extends AppError {
  constructor(maxSize: number = 100) {
    super(
      `Batch location ingestion size exceeds limit of ${maxSize} updates`,
      400,
      "BATCH_TOO_LARGE",
    );
    this.name = "BatchSizeExceededError";
  }
}

export class SubscriptionDeniedError extends AppError {
  constructor(channel: string = "channel") {
    super(
      `Subscription to real-time channel '${channel}' denied due to insufficient permissions`,
      403,
      "SUBSCRIPTION_DENIED",
    );
    this.name = "SubscriptionDeniedError";
  }
}

export class RealtimeConnectionError extends AppError {
  constructor(message: string = "Real-time stream connection failed") {
    super(message, 500, "REALTIME_CONNECTION_FAILED");
    this.name = "RealtimeConnectionError";
  }
}

// ─── Phase 10 — GIS Query & Analytics Engine Errors ──────────────────────────

export class SpatialQueryTooComplexError extends AppError {
  constructor(
    message: string = "Spatial query exceeds maximum complexity. Reduce filter count, nesting depth, or polygon vertices.",
  ) {
    super(message, 400, "SPATIAL_QUERY_TOO_COMPLEX");
    this.name = "SpatialQueryTooComplexError";
  }
}

export class QueryLimitExceededError extends AppError {
  constructor(message: string = "Query result limit exceeds maximum allowed") {
    super(message, 400, "QUERY_LIMIT_EXCEEDED");
    this.name = "QueryLimitExceededError";
  }
}

export class InvalidFilterError extends AppError {
  constructor(message: string = "Invalid or disallowed query filter") {
    super(message, 400, "INVALID_FILTER");
    this.name = "InvalidFilterError";
  }
}

export class InvalidTimeRangeError extends AppError {
  constructor(message: string = "Invalid time range for query") {
    super(message, 400, "INVALID_TIME_RANGE");
    this.name = "InvalidTimeRangeError";
  }
}

export class LayerAccessDeniedError extends AppError {
  constructor(layerId: string = "unknown") {
    super(
      `Access to spatial layer '${layerId}' is denied`,
      403,
      "LAYER_ACCESS_DENIED",
    );
    this.name = "LayerAccessDeniedError";
  }
}

export class InvalidQueryTypeError extends AppError {
  constructor(message: string = "Invalid or unsupported query type") {
    super(message, 400, "INVALID_QUERY_TYPE");
    this.name = "InvalidQueryTypeError";
  }
}

export class AnalyticsError extends AppError {
  constructor(message: string = "Analytics computation failed") {
    super(message, 500, "ANALYTICS_ERROR");
    this.name = "AnalyticsError";
  }
}

// ─── Phase 11 — GIS Rules & Automation Engine Errors ─────────────────────────

export class InvalidWebhookUrlError extends AppError {
  constructor(message: string = "Invalid or restricted webhook URL") {
    super(message, 400, "INVALID_WEBHOOK_URL");
    this.name = "InvalidWebhookUrlError";
  }
}

export class RuleNotFoundError extends AppError {
  constructor(ruleId: string = "unknown") {
    super(`Spatial rule '${ruleId}' not found`, 404, "RULE_NOT_FOUND");
    this.name = "RuleNotFoundError";
  }
}

export class InvalidRuleConfigurationError extends AppError {
  constructor(message: string = "Invalid rule configuration") {
    super(message, 400, "INVALID_RULE_CONFIGURATION");
    this.name = "InvalidRuleConfigurationError";
  }
}

export class RuleActivationError extends AppError {
  constructor(
    message: string = "Cannot activate rule due to validation errors",
  ) {
    super(message, 400, "RULE_ACTIVATION_ERROR");
    this.name = "RuleActivationError";
  }
}

export class RuleExecutionError extends AppError {
  constructor(message: string = "Rule execution failed") {
    super(message, 500, "RULE_EXECUTION_ERROR");
    this.name = "RuleExecutionError";
  }
}

export class AutomationDepthExceededError extends AppError {
  constructor(depth: number) {
    super(
      `Automation recursion depth exceeded maximum limit (${depth})`,
      429,
      "AUTOMATION_DEPTH_EXCEEDED",
    );
    this.name = "AutomationDepthExceededError";
  }
}

export class AlertNotFoundError extends AppError {
  constructor(alertId: string = "unknown") {
    super(`GIS Alert '${alertId}' not found`, 404, "ALERT_NOT_FOUND");
    this.name = "AlertNotFoundError";
  }
}

export class TaskNotFoundError extends AppError {
  constructor(taskId: string = "unknown") {
    super(`Workflow Task '${taskId}' not found`, 404, "TASK_NOT_FOUND");
    this.name = "TaskNotFoundError";
  }
}
