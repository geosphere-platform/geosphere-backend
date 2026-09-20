import { HTTPClient } from "../http/index.js";
import { GeoSphereSearchSDK, GeoSphereSearchConfig, IGeoSphereSearchProvider, GeoSphereSearchHistoryStore } from "../contracts/search.contracts.js";

export class SearchModule {
  constructor(private http: HTTPClient) {}

  public createSearchSDK(
    config?: GeoSphereSearchConfig,
    provider?: IGeoSphereSearchProvider,
    historyStore?: GeoSphereSearchHistoryStore
  ): GeoSphereSearchSDK {
    return new GeoSphereSearchSDK(config, provider, historyStore);
  }
}

export * from "../contracts/search.contracts.js";
export * from "../contracts/search-ui.contracts.js";
