import {
  GISSDK,
  ApiClient,
  BoundingBox,
  GeoJSONFeatureCollection,
} from "@gis-sdk/core";

export interface DensityAnalysisParams {
  layerId: string;
  gridSizeMeters?: number;
  bbox?: BoundingBox;
}

export interface HeatmapParams {
  layerId: string;
  radiusMeters?: number;
  weightProperty?: string;
}

export interface SpatialAggregationParams {
  layerId: string;
  groupByProperty: string;
  aggregateFunction: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
  targetProperty?: string;
}

export interface AnalyticsResult {
  type: string;
  data: any;
  computedAt: string;
}

export class AnalyticsSDK {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || GISSDK.getInstance().getApiClient();
  }

  public async getDensity(
    params: DensityAnalysisParams,
  ): Promise<AnalyticsResult> {
    return this.apiClient.post("/api/v1/spatial/analytics/density", params);
  }

  public async getHeatmapData(
    params: HeatmapParams,
  ): Promise<GeoJSONFeatureCollection> {
    return this.apiClient.post("/api/v1/spatial/analytics/heatmap", params);
  }

  public async getAggregation(
    params: SpatialAggregationParams,
  ): Promise<AnalyticsResult> {
    return this.apiClient.post("/api/v1/spatial/analytics/aggregation", params);
  }

  public async getTimeSeriesSpatial(
    layerId: string,
    startTime: string,
    endTime: string,
  ): Promise<AnalyticsResult> {
    return this.apiClient.post("/api/v1/spatial/analytics/time-series", {
      layerId,
      startTime,
      endTime,
    });
  }
}
