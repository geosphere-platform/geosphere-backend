import { HTTPClient } from "../http/index.js";
import { GISMap, APIResponse } from "../types/index.js";
import { GeoSphereMapping, GeoSphereMappingConfig } from "../contracts/mapping.contracts.js";
export declare class MapsModule {
    private http;
    constructor(http: HTTPClient);
    createMapping(config: GeoSphereMappingConfig): GeoSphereMapping;
    listMaps(): Promise<APIResponse<GISMap[]>>;
    getMap(mapId: string): Promise<APIResponse<GISMap>>;
    createMap(mapData: Partial<GISMap>): Promise<APIResponse<GISMap>>;
}
export * from "../contracts/mapping.contracts.js";
export * from "../contracts/mapping-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map