import { GeoSphereTrackingSDK } from "../contracts/tracking.contracts.js";
export class TrackingModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createTrackingSDK(config) {
        return new GeoSphereTrackingSDK(config);
    }
}
export * from "../contracts/tracking.contracts.js";
export * from "../contracts/tracking-ui.contracts.js";
//# sourceMappingURL=index.js.map