/**
 * GeoSphere Unified Error Contracts
 */
import { GeoSphereError, GeoSphereErrorCode } from "../errors/index.js";
export type ErrorCategory = "VALIDATION" | "AUTHENTICATION" | "AUTHORIZATION" | "NETWORK" | "CONFIGURATION" | "NOT_FOUND" | "CONFLICT" | "TIMEOUT" | "INTERNAL" | "UNSUPPORTED";
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
export declare class GeoSphereContractError extends GeoSphereError implements GeoSphereErrorContract {
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly metadata?: Record<string, unknown>;
    readonly cause?: unknown;
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
    });
}
//# sourceMappingURL=errors.contracts.d.ts.map