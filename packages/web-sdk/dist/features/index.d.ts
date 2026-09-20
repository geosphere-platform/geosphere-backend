import { HTTPClient } from "../http/index.js";
import { GeoJSONFeatureCollection, GeoJSONFeature, APIResponse } from "../types/index.js";
export declare class FeaturesModule {
    private http;
    constructor(http: HTTPClient);
    getFeatures(layerId: string): Promise<APIResponse<GeoJSONFeatureCollection>>;
    addFeature(layerId: string, feature: GeoJSONFeature): Promise<APIResponse<GeoJSONFeature>>;
}
//# sourceMappingURL=index.d.ts.map