import { GeoSphereSpatialAnalysisSDK } from "../contracts/spatial-analysis.contracts.js";
export class SpatialAnalysisModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createSpatialAnalysisSDK(config, provider) {
        return new GeoSphereSpatialAnalysisSDK(config, provider);
    }
}
export * from "../contracts/spatial-analysis.contracts.js";
export * from "../contracts/spatial-analysis-ui.contracts.js";
//# sourceMappingURL=index.js.map