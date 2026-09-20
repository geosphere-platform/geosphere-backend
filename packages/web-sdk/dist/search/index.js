import { GeoSphereSearchSDK } from "../contracts/search.contracts.js";
export class SearchModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createSearchSDK(config, provider, historyStore) {
        return new GeoSphereSearchSDK(config, provider, historyStore);
    }
}
export * from "../contracts/search.contracts.js";
export * from "../contracts/search-ui.contracts.js";
//# sourceMappingURL=index.js.map