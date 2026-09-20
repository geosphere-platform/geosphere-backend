import { HTTPClient } from "../http/index.js";
import { GeoSphereRealtimeSDK, GeoSphereRealtimeConfig, GeoSphereRealtimeProvider } from "../contracts/realtime.contracts.js";
export declare class RealtimeModule {
    private http;
    constructor(http: HTTPClient);
    createRealtimeSDK(config?: GeoSphereRealtimeConfig, provider?: GeoSphereRealtimeProvider): GeoSphereRealtimeSDK;
}
export * from "../contracts/realtime.contracts.js";
export * from "../contracts/realtime-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map