import { HTTPClient } from "../http/index.js";
import { GeoSphereTrackingSDK, GeoSphereTrackingConfig } from "../contracts/tracking.contracts.js";

export class TrackingModule {
  constructor(private http: HTTPClient) {}

  public createTrackingSDK(config?: GeoSphereTrackingConfig): GeoSphereTrackingSDK {
    return new GeoSphereTrackingSDK(config);
  }
}

export * from "../contracts/tracking.contracts.js";
export * from "../contracts/tracking-ui.contracts.js";
