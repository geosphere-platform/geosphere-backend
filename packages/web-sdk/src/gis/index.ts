import { HTTPClient } from "../http/index.js";
import { GISMap, GISLayer, GeoJSONFeatureCollection, BoundingBox, APIResponse } from "../types/index.js";
import { GeoSphereGIS, GeoSphereGISConfig } from "../contracts/gis.contracts.js";

export class GISModule {
  constructor(private http: HTTPClient) {}

  public createMap(config: GeoSphereGISConfig): GeoSphereGIS {
    return new GeoSphereGIS(config);
  }

  public async getSpatialOverview(): Promise<APIResponse<{ mapCount: number; layerCount: number; featureCount: number }>> {
    return this.http.get<{ mapCount: number; layerCount: number; featureCount: number }>("/api/gis/overview");
  }

  public async spatialQuery(bbox: BoundingBox, layerIds?: string[]): Promise<APIResponse<GeoJSONFeatureCollection>> {
    return this.http.post<GeoJSONFeatureCollection>("/api/gis/query", { bbox, layerIds });
  }
}

export * from "../contracts/gis.contracts.js";
export * from "../contracts/gis-ui.contracts.js";
