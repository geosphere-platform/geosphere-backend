import { HTTPClient } from "../http/index.js";
import { GeoSphereOfflineSDK, GeoSphereOfflineConfig, GeoSphereOfflineStorage } from "../contracts/offline.contracts.js";
export declare class OfflineModule {
    private http;
    constructor(http: HTTPClient);
    createOfflineSDK(config?: GeoSphereOfflineConfig, storage?: GeoSphereOfflineStorage): GeoSphereOfflineSDK;
}
export * from "../contracts/offline.contracts.js";
export * from "../contracts/offline-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map