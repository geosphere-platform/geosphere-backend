import { GeoSphereRealtimeSDK } from "../contracts/realtime.contracts.js";
export class RealtimeModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createRealtimeSDK(config, provider) {
        return new GeoSphereRealtimeSDK(config, provider);
    }
}
export * from "../contracts/realtime.contracts.js";
export * from "../contracts/realtime-ui.contracts.js";
//# sourceMappingURL=index.js.map