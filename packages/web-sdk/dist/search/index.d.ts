import { HTTPClient } from "../http/index.js";
import { GeoSphereSearchSDK, GeoSphereSearchConfig, IGeoSphereSearchProvider, GeoSphereSearchHistoryStore } from "../contracts/search.contracts.js";
export declare class SearchModule {
    private http;
    constructor(http: HTTPClient);
    createSearchSDK(config?: GeoSphereSearchConfig, provider?: IGeoSphereSearchProvider, historyStore?: GeoSphereSearchHistoryStore): GeoSphereSearchSDK;
}
export * from "../contracts/search.contracts.js";
export * from "../contracts/search-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map