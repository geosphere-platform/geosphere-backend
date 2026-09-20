import { HTTPClient } from "../http/index.js";
import { GISLayer, APIResponse } from "../types/index.js";

export class LayersModule {
  constructor(private http: HTTPClient) {}

  public async listLayers(mapId?: string): Promise<APIResponse<GISLayer[]>> {
    return this.http.get<GISLayer[]>("/api/layers", { params: { mapId } });
  }

  public async getLayer(layerId: string): Promise<APIResponse<GISLayer>> {
    return this.http.get<GISLayer>(`/api/layers/${layerId}`);
  }

  public async createLayer(layerData: Partial<GISLayer>): Promise<APIResponse<GISLayer>> {
    return this.http.post<GISLayer>("/api/layers", layerData);
  }
}
