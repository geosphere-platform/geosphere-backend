/**
 * GeoSphere Web SDK — Embedded Fleet Telemetry Panel Controller & UI
 */
export interface SDKAgentTelemetry {
    id: string;
    name: string;
    email: string;
    availability: "AVAILABLE" | "ON_TASK" | "ON_BREAK";
    batteryLevel: number;
    lat: number;
    lng: number;
}
export declare class GeoSphereTelemetryController {
    private agents;
    constructor(agents: SDKAgentTelemetry[]);
    getAgents(): SDKAgentTelemetry[];
    renderHTML(): string;
}
//# sourceMappingURL=telemetry-panel.d.ts.map