export enum GeoSphereErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  TENANT_ISOLATION_ERROR = "TENANT_ISOLATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  SERVER_ERROR = "SERVER_ERROR",
  IDEMPOTENCY_ERROR = "IDEMPOTENCY_ERROR"
}

export class GeoSphereError extends Error {
  public readonly code: GeoSphereErrorCode;
  public readonly statusCode?: number;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: GeoSphereErrorCode,
    statusCode?: number,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = "GeoSphereError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;

    const errorConstructor = Error as unknown as { captureStackTrace?: (target: object, constructor: unknown) => void };
    if (typeof errorConstructor.captureStackTrace === "function") {
      errorConstructor.captureStackTrace(this, GeoSphereError);
    }
  }
}
