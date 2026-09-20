import { HTTPClient } from "../http/index.js";
import { GeoSphereRoutingSDK, GeoSphereRoutingConfig } from "../contracts/routing.contracts.js";
export declare class RoutingModule {
    private http;
    constructor(http: HTTPClient);
    createRoutingSDK(config?: GeoSphereRoutingConfig): GeoSphereRoutingSDK;
}
export * from "../contracts/routing.contracts.js";
export * from "../contracts/routing-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map