import { HTTPClient } from "../http/index.js";
import { Geofence, APIResponse } from "../types/index.js";
import { GeoSphereGeofencingSDK, GeoSphereGeofenceConfig } from "../contracts/geofence.contracts.js";

export class GeofenceModule {
  constructor(private http: HTTPClient) {}

  public createGeofencingSDK(config?: GeoSphereGeofenceConfig): GeoSphereGeofencingSDK {
    return new GeoSphereGeofencingSDK(config);
  }

  public async listGeofences(): Promise<APIResponse<Geofence[]>> {
    return this.http.get<Geofence[]>("/api/geofences");
  }

  public async createGeofence(geofence: Partial<Geofence>): Promise<APIResponse<Geofence>> {
    return this.http.post<Geofence>("/api/geofences", geofence);
  }

  public async checkPoint(lat: number, lng: number): Promise<APIResponse<{ insideGeofences: Geofence[] }>> {
    return this.http.post<{ insideGeofences: Geofence[] }>("/api/geofences/evaluate", { latitude: lat, longitude: lng });
  }
}

export * from "../contracts/geofence.contracts.js";
export * from "../contracts/geofence-ui.contracts.js";
