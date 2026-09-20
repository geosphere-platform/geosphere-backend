import { HTTPClient } from "../http/index.js";
import { GISMap, APIResponse } from "../types/index.js";
import { GeoSphereMapping, GeoSphereMappingConfig } from "../contracts/mapping.contracts.js";

export class MapsModule {
  constructor(private http: HTTPClient) {}

  public createMapping(config: GeoSphereMappingConfig): GeoSphereMapping {
    return new GeoSphereMapping(config);
  }

  public async listMaps(): Promise<APIResponse<GISMap[]>> {
    return this.http.get<GISMap[]>("/api/maps");
  }

  public async getMap(mapId: string): Promise<APIResponse<GISMap>> {
    return this.http.get<GISMap>(`/api/maps/${mapId}`);
  }

  public async createMap(mapData: Partial<GISMap>): Promise<APIResponse<GISMap>> {
    return this.http.post<GISMap>("/api/maps", mapData);
  }
}

export * from "../contracts/mapping.contracts.js";
export * from "../contracts/mapping-ui.contracts.js";
