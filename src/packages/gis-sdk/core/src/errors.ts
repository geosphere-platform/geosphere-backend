export enum SDKErrorCode {
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  TENANT_CONTEXT_ERROR = "TENANT_CONTEXT_ERROR",
  FEATURE_NOT_AVAILABLE = "FEATURE_NOT_AVAILABLE",
  LIMIT_EXCEEDED = "LIMIT_EXCEEDED",
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  GIS_OPERATION_ERROR = "GIS_OPERATION_ERROR",
  REALTIME_ERROR = "REALTIME_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

export class SDKError extends Error {
  public readonly code: SDKErrorCode;
  public readonly statusCode?: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;

  constructor(
    code: SDKErrorCode,
    message: string,
    statusCode?: number,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = "SDKError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Preserve stack trace in Node / V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SDKError);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}

export function normalizeBackendError(err: any): SDKError {
  if (err instanceof SDKError) {
    return err;
  }

  const statusCode = err?.status || err?.statusCode || 500;
  const rawMessage =
    err?.message || err?.error || "An unexpected GIS SDK error occurred";
  const details = err?.details || err?.data || undefined;

  let code: SDKErrorCode = SDKErrorCode.GIS_OPERATION_ERROR;

  if (statusCode === 401) {
    code = SDKErrorCode.AUTHENTICATION_ERROR;
  } else if (statusCode === 403) {
    if (
      rawMessage.toLowerCase().includes("tenant") ||
      rawMessage.toLowerCase().includes("organization")
    ) {
      code = SDKErrorCode.TENANT_CONTEXT_ERROR;
    } else if (
      rawMessage.toLowerCase().includes("entitlement") ||
      rawMessage.toLowerCase().includes("feature")
    ) {
      code = SDKErrorCode.FEATURE_NOT_AVAILABLE;
    } else if (
      rawMessage.toLowerCase().includes("limit") ||
      rawMessage.toLowerCase().includes("quota")
    ) {
      code = SDKErrorCode.LIMIT_EXCEEDED;
    } else {
      code = SDKErrorCode.AUTHORIZATION_ERROR;
    }
  } else if (statusCode === 400 || statusCode === 422) {
    code = SDKErrorCode.VALIDATION_ERROR;
  } else if (
    statusCode === 408 ||
    statusCode === 504 ||
    rawMessage.toLowerCase().includes("timeout")
  ) {
    code = SDKErrorCode.TIMEOUT_ERROR;
  } else if (
    statusCode === 0 ||
    rawMessage.toLowerCase().includes("network") ||
    rawMessage.toLowerCase().includes("fetch")
  ) {
    code = SDKErrorCode.NETWORK_ERROR;
  }

  return new SDKError(code, rawMessage, statusCode, details);
}
