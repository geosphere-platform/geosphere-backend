import { HTTPClient } from "../http/index.js";
import { GeoSphereSpatialAnalysisSDK, GeoSphereSpatialAnalysisConfig, IGeoSphereSpatialAnalysisProvider } from "../contracts/spatial-analysis.contracts.js";

export class SpatialAnalysisModule {
  constructor(private http: HTTPClient) {}

  public createSpatialAnalysisSDK(
    config?: GeoSphereSpatialAnalysisConfig,
    provider?: IGeoSphereSpatialAnalysisProvider
  ): GeoSphereSpatialAnalysisSDK {
    return new GeoSphereSpatialAnalysisSDK(config, provider);
  }
}

export * from "../contracts/spatial-analysis.contracts.js";
export * from "../contracts/spatial-analysis-ui.contracts.js";
