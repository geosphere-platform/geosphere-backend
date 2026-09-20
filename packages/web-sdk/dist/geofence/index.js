import { GeoSphereGeofencingSDK } from "../contracts/geofence.contracts.js";
export class GeofenceModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createGeofencingSDK(config) {
        return new GeoSphereGeofencingSDK(config);
    }
    async listGeofences() {
        return this.http.get("/api/geofences");
    }
    async createGeofence(geofence) {
        return this.http.post("/api/geofences", geofence);
    }
    async checkPoint(lat, lng) {
        return this.http.post("/api/geofences/evaluate", { latitude: lat, longitude: lng });
    }
}
export * from "../contracts/geofence.contracts.js";
export * from "../contracts/geofence-ui.contracts.js";
//# sourceMappingURL=index.js.map