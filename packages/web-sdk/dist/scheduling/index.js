import { GeoSphereSchedulingSDK } from "../contracts/scheduling.contracts.js";
export class SchedulingModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listEvents() {
        return this.http.get("/api/scheduling/events");
    }
    async getEvent(eventId) {
        return this.http.get(`/api/scheduling/events/${eventId}`);
    }
    createSchedulingSDK(config, provider) {
        return new GeoSphereSchedulingSDK(config, provider);
    }
}
export * from "../contracts/scheduling.contracts.js";
export * from "../contracts/scheduling-ui.contracts.js";
//# sourceMappingURL=index.js.map