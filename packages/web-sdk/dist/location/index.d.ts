import { HTTPClient } from "../http/index.js";
import { LocationTelemetry, APIResponse } from "../types/index.js";
import { GeoSphereLocationSDK, GeoSphereLocationConfig } from "../contracts/location.contracts.js";
export declare class LocationModule {
    private http;
    constructor(http: HTTPClient);
    createLocationSDK(config?: GeoSphereLocationConfig): GeoSphereLocationSDK;
    sendTelemetry(telemetry: LocationTelemetry): Promise<APIResponse<void>>;
    getHistory(entityId: string, from: string, to: string): Promise<APIResponse<LocationTelemetry[]>>;
}
export * from "../contracts/location.contracts.js";
export * from "../contracts/location-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map