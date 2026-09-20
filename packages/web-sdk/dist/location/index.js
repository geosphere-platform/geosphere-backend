import { GeoSphereLocationSDK } from "../contracts/location.contracts.js";
export class LocationModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createLocationSDK(config) {
        return new GeoSphereLocationSDK(config);
    }
    async sendTelemetry(telemetry) {
        return this.http.post("/api/location/telemetry", telemetry, {
            idempotencyKey: telemetry.id
        });
    }
    async getHistory(entityId, from, to) {
        return this.http.get(`/api/location/history/${entityId}`, {
            params: { from, to }
        });
    }
}
export * from "../contracts/location.contracts.js";
export * from "../contracts/location-ui.contracts.js";
//# sourceMappingURL=index.js.map