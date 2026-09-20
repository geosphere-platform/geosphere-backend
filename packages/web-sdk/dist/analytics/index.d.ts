import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
import { GeoSphereAnalyticsSDK, GeoSphereAnalyticsConfig, GeoSphereAnalyticsProvider } from "../contracts/analytics.contracts.js";
export declare class AnalyticsModule {
    private http;
    constructor(http: HTTPClient);
    getSpatialMetrics(timeframe: string): Promise<APIResponse<Record<string, unknown>>>;
    createAnalyticsSDK(config?: GeoSphereAnalyticsConfig, provider?: GeoSphereAnalyticsProvider): GeoSphereAnalyticsSDK;
}
export * from "../contracts/analytics.contracts.js";
export * from "../contracts/analytics-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map