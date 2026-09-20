import { HTTPClient } from "../http/index.js";
import { GeoJSONFeatureCollection, BoundingBox, APIResponse } from "../types/index.js";
import { GeoSphereGIS, GeoSphereGISConfig } from "../contracts/gis.contracts.js";
export declare class GISModule {
    private http;
    constructor(http: HTTPClient);
    createMap(config: GeoSphereGISConfig): GeoSphereGIS;
    getSpatialOverview(): Promise<APIResponse<{
        mapCount: number;
        layerCount: number;
        featureCount: number;
    }>>;
    spatialQuery(bbox: BoundingBox, layerIds?: string[]): Promise<APIResponse<GeoJSONFeatureCollection>>;
}
export * from "../contracts/gis.contracts.js";
export * from "../contracts/gis-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map