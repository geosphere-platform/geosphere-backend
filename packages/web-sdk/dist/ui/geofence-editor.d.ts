/**
 * GeoSphere Web SDK — Embedded Geofence Perimeter Editor Controller & UI
 */
export interface SDKGeofenceConfig {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radiusMeters: number;
    triggers: ("ENTER" | "EXIT" | "DWELL")[];
}
export declare class GeoSphereGeofenceController {
    private config;
    constructor(config: SDKGeofenceConfig);
    setRadius(radiusMeters: number): void;
    getConfig(): SDKGeofenceConfig;
    renderHTML(): string;
}
//# sourceMappingURL=geofence-editor.d.ts.map