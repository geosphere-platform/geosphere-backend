import { GeoSphereAnalyticsSDK } from "../contracts/analytics.contracts.js";
export class AnalyticsModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async getSpatialMetrics(timeframe) {
        return this.http.get("/api/analytics/spatial", { params: { timeframe } });
    }
    createAnalyticsSDK(config, provider) {
        return new GeoSphereAnalyticsSDK(config, provider);
    }
}
export * from "../contracts/analytics.contracts.js";
export * from "../contracts/analytics-ui.contracts.js";
//# sourceMappingURL=index.js.map