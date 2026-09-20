import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
import { GeoSphereAssetSDK, GeoSphereAssetConfig, GeoSphereAssetProvider, GeoSphereAssetInstance } from "../contracts/asset.contracts.js";

export class AssetsModule {
  constructor(private http: HTTPClient) {}

  public async listAssets(): Promise<APIResponse<GeoSphereAssetInstance[]>> {
    return this.http.get<GeoSphereAssetInstance[]>("/api/assets");
  }

  public async getAsset(assetId: string): Promise<APIResponse<GeoSphereAssetInstance>> {
    return this.http.get<GeoSphereAssetInstance>(`/api/assets/${assetId}`);
  }

  public createAssetSDK(
    config?: GeoSphereAssetConfig,
    provider?: GeoSphereAssetProvider
  ): GeoSphereAssetSDK {
    return new GeoSphereAssetSDK(config, provider);
  }
}

export * from "../contracts/asset.contracts.js";
export * from "../contracts/asset-ui.contracts.js";
