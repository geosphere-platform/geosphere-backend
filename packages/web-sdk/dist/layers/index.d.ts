import { HTTPClient } from "../http/index.js";
import { GISLayer, APIResponse } from "../types/index.js";
export declare class LayersModule {
    private http;
    constructor(http: HTTPClient);
    listLayers(mapId?: string): Promise<APIResponse<GISLayer[]>>;
    getLayer(layerId: string): Promise<APIResponse<GISLayer>>;
    createLayer(layerData: Partial<GISLayer>): Promise<APIResponse<GISLayer>>;
}
//# sourceMappingURL=index.d.ts.map