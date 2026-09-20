export var GeoSphereErrorCode;
(function (GeoSphereErrorCode) {
    GeoSphereErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    GeoSphereErrorCode["FORBIDDEN"] = "FORBIDDEN";
    GeoSphereErrorCode["NOT_FOUND"] = "NOT_FOUND";
    GeoSphereErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    GeoSphereErrorCode["TENANT_ISOLATION_ERROR"] = "TENANT_ISOLATION_ERROR";
    GeoSphereErrorCode["RATE_LIMITED"] = "RATE_LIMITED";
    GeoSphereErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    GeoSphereErrorCode["TIMEOUT"] = "TIMEOUT";
    GeoSphereErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
    GeoSphereErrorCode["IDEMPOTENCY_ERROR"] = "IDEMPOTENCY_ERROR";
})(GeoSphereErrorCode || (GeoSphereErrorCode = {}));
export class GeoSphereError extends Error {
    code;
    statusCode;
    details;
    requestId;
    constructor(message, code, statusCode, details, requestId) {
        super(message);
        this.name = "GeoSphereError";
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.requestId = requestId;
        const errorConstructor = Error;
        if (typeof errorConstructor.captureStackTrace === "function") {
            errorConstructor.captureStackTrace(this, GeoSphereError);
        }
    }
}
//# sourceMappingURL=index.js.map