import { HTTPClient } from "../http/index.js";
import { GeoSphereTrackingSDK, GeoSphereTrackingConfig } from "../contracts/tracking.contracts.js";
export declare class TrackingModule {
    private http;
    constructor(http: HTTPClient);
    createTrackingSDK(config?: GeoSphereTrackingConfig): GeoSphereTrackingSDK;
}
export * from "../contracts/tracking.contracts.js";
export * from "../contracts/tracking-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map