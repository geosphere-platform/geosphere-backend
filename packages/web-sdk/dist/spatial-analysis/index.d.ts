import { HTTPClient } from "../http/index.js";
import { GeoSphereSpatialAnalysisSDK, GeoSphereSpatialAnalysisConfig, IGeoSphereSpatialAnalysisProvider } from "../contracts/spatial-analysis.contracts.js";
export declare class SpatialAnalysisModule {
    private http;
    constructor(http: HTTPClient);
    createSpatialAnalysisSDK(config?: GeoSphereSpatialAnalysisConfig, provider?: IGeoSphereSpatialAnalysisProvider): GeoSphereSpatialAnalysisSDK;
}
export * from "../contracts/spatial-analysis.contracts.js";
export * from "../contracts/spatial-analysis-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map