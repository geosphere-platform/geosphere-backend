import { GeoSphereAssetSDK } from "../contracts/asset.contracts.js";
export class AssetsModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listAssets() {
        return this.http.get("/api/assets");
    }
    async getAsset(assetId) {
        return this.http.get(`/api/assets/${assetId}`);
    }
    createAssetSDK(config, provider) {
        return new GeoSphereAssetSDK(config, provider);
    }
}
export * from "../contracts/asset.contracts.js";
export * from "../contracts/asset-ui.contracts.js";
//# sourceMappingURL=index.js.map