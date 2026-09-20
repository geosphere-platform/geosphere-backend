/**
 * GeoSphere Unified Error Contracts
 */

import { GeoSphereError, GeoSphereErrorCode } from "../errors/index.js";

export type ErrorCategory =
  | "VALIDATION"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "NETWORK"
  | "CONFIGURATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TIMEOUT"
  | "INTERNAL"
  | "UNSUPPORTED";

export type ErrorSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface GeoSphereErrorContract {
  code: GeoSphereErrorCode | string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  status?: number;
  cause?: unknown;
  metadata?: Record<string, unknown>;
}

export class GeoSphereContractError extends GeoSphereError implements GeoSphereErrorContract {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly metadata?: Record<string, unknown>;
  public readonly cause?: unknown;

  constructor(params: {
    message: string;
    code: GeoSphereErrorCode | string;
    category: ErrorCategory;
    severity?: ErrorSeverity;
    statusCode?: number;
    details?: unknown;
    metadata?: Record<string, unknown>;
    cause?: unknown;
    requestId?: string;
  }) {
    const validCode = typeof params.code === "string" && params.code in GeoSphereErrorCode
      ? (params.code as GeoSphereErrorCode)
      : GeoSphereErrorCode.SERVER_ERROR;

    super(params.message, validCode, params.statusCode, params.details, params.requestId);

    this.name = "GeoSphereContractError";
    this.category = params.category;
    this.severity = params.severity || "ERROR";
    this.metadata = params.metadata;
    this.cause = params.cause;
  }
}
