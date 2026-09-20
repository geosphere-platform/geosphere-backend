import { HTTPClient } from "../http/index.js";
import { GeoSphereOfflineSDK, GeoSphereOfflineConfig, GeoSphereOfflineStorage } from "../contracts/offline.contracts.js";

export class OfflineModule {
  constructor(private http: HTTPClient) {}

  public createOfflineSDK(
    config?: GeoSphereOfflineConfig,
    storage?: GeoSphereOfflineStorage
  ): GeoSphereOfflineSDK {
    return new GeoSphereOfflineSDK(config, storage);
  }
}

export * from "../contracts/offline.contracts.js";
export * from "../contracts/offline-ui.contracts.js";
