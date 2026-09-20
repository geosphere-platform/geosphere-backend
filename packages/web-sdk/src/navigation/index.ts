import { HTTPClient } from "../http/index.js";
import { GeoSphereNavigationSDK, GeoSphereNavigationConfig } from "../contracts/navigation.contracts.js";

export class NavigationModule {
  constructor(private http: HTTPClient) {}

  public createNavigationSDK(config?: GeoSphereNavigationConfig): GeoSphereNavigationSDK {
    return new GeoSphereNavigationSDK(config);
  }
}

export * from "../contracts/navigation.contracts.js";
export * from "../contracts/navigation-ui.contracts.js";
