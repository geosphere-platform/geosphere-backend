import { HTTPClient } from "../http/index.js";
import { GeoSphereNavigationSDK, GeoSphereNavigationConfig } from "../contracts/navigation.contracts.js";
export declare class NavigationModule {
    private http;
    constructor(http: HTTPClient);
    createNavigationSDK(config?: GeoSphereNavigationConfig): GeoSphereNavigationSDK;
}
export * from "../contracts/navigation.contracts.js";
export * from "../contracts/navigation-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map