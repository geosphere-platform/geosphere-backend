import { HTTPClient } from "../http/index.js";
import { GeoSphereRoutingSDK, GeoSphereRoutingConfig } from "../contracts/routing.contracts.js";

export class RoutingModule {
  constructor(private http: HTTPClient) {}

  public createRoutingSDK(config?: GeoSphereRoutingConfig): GeoSphereRoutingSDK {
    return new GeoSphereRoutingSDK(config);
  }
}

export * from "../contracts/routing.contracts.js";
export * from "../contracts/routing-ui.contracts.js";
