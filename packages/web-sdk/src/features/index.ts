import { HTTPClient } from "../http/index.js";
import { GeoJSONFeatureCollection, GeoJSONFeature, APIResponse } from "../types/index.js";

export class FeaturesModule {
  constructor(private http: HTTPClient) {}

  public async getFeatures(layerId: string): Promise<APIResponse<GeoJSONFeatureCollection>> {
    return this.http.get<GeoJSONFeatureCollection>(`/api/layers/${layerId}/features`);
  }

  public async addFeature(layerId: string, feature: GeoJSONFeature): Promise<APIResponse<GeoJSONFeature>> {
    return this.http.post<GeoJSONFeature>(`/api/layers/${layerId}/features`, feature);
  }
}
