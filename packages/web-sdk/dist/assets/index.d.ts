import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
import { GeoSphereAssetSDK, GeoSphereAssetConfig, GeoSphereAssetProvider, GeoSphereAssetInstance } from "../contracts/asset.contracts.js";
export declare class AssetsModule {
    private http;
    constructor(http: HTTPClient);
    listAssets(): Promise<APIResponse<GeoSphereAssetInstance[]>>;
    getAsset(assetId: string): Promise<APIResponse<GeoSphereAssetInstance>>;
    createAssetSDK(config?: GeoSphereAssetConfig, provider?: GeoSphereAssetProvider): GeoSphereAssetSDK;
}
export * from "../contracts/asset.contracts.js";
export * from "../contracts/asset-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map