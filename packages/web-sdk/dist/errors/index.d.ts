export declare enum GeoSphereErrorCode {
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
export declare class GeoSphereError extends Error {
    readonly code: GeoSphereErrorCode;
    readonly statusCode?: number;
    readonly details?: unknown;
    readonly requestId?: string;
    constructor(message: string, code: GeoSphereErrorCode, statusCode?: number, details?: unknown, requestId?: string);
}
//# sourceMappingURL=index.d.ts.map