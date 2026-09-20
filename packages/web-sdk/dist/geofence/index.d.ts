import { HTTPClient } from "../http/index.js";
import { Geofence, APIResponse } from "../types/index.js";
import { GeoSphereGeofencingSDK, GeoSphereGeofenceConfig } from "../contracts/geofence.contracts.js";
export declare class GeofenceModule {
    private http;
    constructor(http: HTTPClient);
    createGeofencingSDK(config?: GeoSphereGeofenceConfig): GeoSphereGeofencingSDK;
    listGeofences(): Promise<APIResponse<Geofence[]>>;
    createGeofence(geofence: Partial<Geofence>): Promise<APIResponse<Geofence>>;
    checkPoint(lat: number, lng: number): Promise<APIResponse<{
        insideGeofences: Geofence[];
    }>>;
}
export * from "../contracts/geofence.contracts.js";
export * from "../contracts/geofence-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map