import { GeoSphereOfflineSDK } from "../contracts/offline.contracts.js";
export class OfflineModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createOfflineSDK(config, storage) {
        return new GeoSphereOfflineSDK(config, storage);
    }
}
export * from "../contracts/offline.contracts.js";
export * from "../contracts/offline-ui.contracts.js";
//# sourceMappingURL=index.js.map