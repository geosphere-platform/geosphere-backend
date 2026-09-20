/**
 * GeoSphere Unified Error Contracts
 */
import { GeoSphereError, GeoSphereErrorCode } from "../errors/index.js";
export class GeoSphereContractError extends GeoSphereError {
    category;
    severity;
    metadata;
    cause;
    constructor(params) {
        const validCode = typeof params.code === "string" && params.code in GeoSphereErrorCode
            ? params.code
            : GeoSphereErrorCode.SERVER_ERROR;
        super(params.message, validCode, params.statusCode, params.details, params.requestId);
        this.name = "GeoSphereContractError";
        this.category = params.category;
        this.severity = params.severity || "ERROR";
        this.metadata = params.metadata;
        this.cause = params.cause;
    }
}
//# sourceMappingURL=errors.contracts.js.map