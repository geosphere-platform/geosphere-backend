import { HTTPClient } from "../http/index.js";
import { GeoSphereRealtimeSDK, GeoSphereRealtimeConfig, GeoSphereRealtimeProvider } from "../contracts/realtime.contracts.js";

export class RealtimeModule {
  constructor(private http: HTTPClient) {}

  public createRealtimeSDK(
    config?: GeoSphereRealtimeConfig,
    provider?: GeoSphereRealtimeProvider
  ): GeoSphereRealtimeSDK {
    return new GeoSphereRealtimeSDK(config, provider);
  }
}

export * from "../contracts/realtime.contracts.js";
export * from "../contracts/realtime-ui.contracts.js";
