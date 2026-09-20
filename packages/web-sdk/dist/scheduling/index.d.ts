import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
import { GeoSphereSchedulingSDK, GeoSphereSchedulingConfig, GeoSphereSchedulingProvider, GeoSphereScheduleEvent } from "../contracts/scheduling.contracts.js";
export declare class SchedulingModule {
    private http;
    constructor(http: HTTPClient);
    listEvents(): Promise<APIResponse<GeoSphereScheduleEvent[]>>;
    getEvent(eventId: string): Promise<APIResponse<GeoSphereScheduleEvent>>;
    createSchedulingSDK(config?: GeoSphereSchedulingConfig, provider?: GeoSphereSchedulingProvider): GeoSphereSchedulingSDK;
}
export * from "../contracts/scheduling.contracts.js";
export * from "../contracts/scheduling-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map