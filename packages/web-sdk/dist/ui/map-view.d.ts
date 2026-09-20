/**
 * GeoSphere Web SDK — GIS Map View Component & Controller
 */
export interface MapMarker {
    id: string;
    type: "AGENT" | "TASK" | "ASSET";
    title: string;
    lat: number;
    lng: number;
    status: string;
}
export interface MapViewConfig {
    center: [number, number];
    zoom: number;
    markers: MapMarker[];
    showGeofences?: boolean;
}
export declare class GeoSphereMapController {
    private config;
    constructor(config: MapViewConfig);
    getMarkers(): MapMarker[];
    addMarker(marker: MapMarker): void;
    setZoom(zoom: number): void;
}
//# sourceMappingURL=map-view.d.ts.map