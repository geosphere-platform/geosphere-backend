import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
import { GeoSphereAnalyticsSDK, GeoSphereAnalyticsConfig, GeoSphereAnalyticsProvider } from "../contracts/analytics.contracts.js";

export class AnalyticsModule {
  constructor(private http: HTTPClient) {}

  public async getSpatialMetrics(timeframe: string): Promise<APIResponse<Record<string, unknown>>> {
    return this.http.get<Record<string, unknown>>("/api/analytics/spatial", { params: { timeframe } });
  }

  public createAnalyticsSDK(
    config?: GeoSphereAnalyticsConfig,
    provider?: GeoSphereAnalyticsProvider
  ): GeoSphereAnalyticsSDK {
    return new GeoSphereAnalyticsSDK(config, provider);
  }
}

export * from "../contracts/analytics.contracts.js";
export * from "../contracts/analytics-ui.contracts.js";
