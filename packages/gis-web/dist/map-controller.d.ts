import Feature from "ol/Feature.js";
export interface MapControllerConfig {
    target: HTMLElement | string;
    center?: [number, number];
    zoom?: number;
}
export declare class GeoSphereMapController {
    private map;
    private vectorSource;
    private vectorLayer;
    constructor(config: MapControllerConfig);
    addMarker(id: string, lng: number, lat: number, properties?: Record<string, unknown>): Feature;
    addPolyline(id: string, coordinates: [number, number][]): Feature;
    addPolygon(id: string, coordinates: [number, number][][]): Feature;
    clearFeatures(): void;
    getExtentBBOX(): [number, number, number, number];
    destroy(): void;
}
//# sourceMappingURL=map-controller.d.ts.map