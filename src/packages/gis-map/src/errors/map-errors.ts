/**
 * GIS Map SDK — Structured Error Handling
 */

export type MapErrorCode =
  | "MAP_INITIALIZATION_FAILED"
  | "INVALID_GEOMETRY"
  | "INVALID_COORDINATE"
  | "LAYER_NOT_FOUND"
  | "FEATURE_NOT_FOUND"
  | "UNSUPPORTED_GEOMETRY"
  | "DRAWING_ERROR"
  | "EDITING_ERROR"
  | "INVALID_CONFIG"
  | "ADAPTER_ERROR";

export class StructuredMapError extends Error {
  public readonly code: MapErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: MapErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(`[GIS Map SDK Error - ${code}]: ${message}`);
    this.name = "StructuredMapError";
    this.code = code;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StructuredMapError);
    }
  }
}
