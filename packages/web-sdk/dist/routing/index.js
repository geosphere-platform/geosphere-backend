import { GeoSphereRoutingSDK } from "../contracts/routing.contracts.js";
export class RoutingModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createRoutingSDK(config) {
        return new GeoSphereRoutingSDK(config);
    }
}
export * from "../contracts/routing.contracts.js";
export * from "../contracts/routing-ui.contracts.js";
//# sourceMappingURL=index.js.map