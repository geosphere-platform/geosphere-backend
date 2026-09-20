import { GeoSphereNavigationSDK } from "../contracts/navigation.contracts.js";
export class NavigationModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createNavigationSDK(config) {
        return new GeoSphereNavigationSDK(config);
    }
}
export * from "../contracts/navigation.contracts.js";
export * from "../contracts/navigation-ui.contracts.js";
//# sourceMappingURL=index.js.map