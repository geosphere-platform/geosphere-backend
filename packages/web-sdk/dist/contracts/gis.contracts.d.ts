/**
 * GeoSphere GIS SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral & Map Engine Independent (Zero OpenLayers/DOM Leakage)
 */
export type SpatialReference = "EPSG:4326" | "EPSG:3857" | string;
export type GeoSphereCoordinate = [number, number, number?];
export type BoundingBoxTuple = [number, number, number, number];
export type GeoSphereGeometryType = "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon" | "GeometryCollection";
export interface PointGeometry {
    type: "Point";
    coordinates: GeoSphereCoordinate;
}
export interface LineStringGeometry {
    type: "LineString";
    coordinates: GeoSphereCoordinate[];
}
export interface PolygonGeometry {
    type: "Polygon";
    coordinates: GeoSphereCoordinate[][];
}
export interface MultiPointGeometry {
    type: "MultiPoint";
    coordinates: GeoSphereCoordinate[];
}
export interface MultiLineStringGeometry {
    type: "MultiLineString";
    coordinates: GeoSphereCoordinate[][];
}
export interface MultiPolygonGeometry {
    type: "MultiPolygon";
    coordinates: GeoSphereCoordinate[][][];
}
export interface GeometryCollection {
    type: "GeometryCollection";
    geometries: GeoSphereGeometry[];
}
export type GeoSphereGeometry = PointGeometry | LineStringGeometry | PolygonGeometry | MultiPointGeometry | MultiLineStringGeometry | MultiPolygonGeometry | GeometryCollection;
export interface GeoSphereFeatureStyle {
    color?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    fillOpacity?: number;
    iconUrl?: string;
    iconSize?: number;
    radius?: number;
}
export interface GeoSphereFeature<P extends Record<string, unknown> = Record<string, unknown>> {
    id: string;
    geometry: GeoSphereGeometry;
    properties: P;
    layerId?: string;
    style?: GeoSphereFeatureStyle;
    metadata?: Record<string, unknown>;
}
export type GeoSphereLayerType = "base" | "vector" | "raster" | "tile" | "feature" | "overlay";
export interface GeoSphereLayer {
    id: string;
    name: string;
    type: GeoSphereLayerType;
    visible: boolean;
    opacity?: number;
    zIndex?: number;
    sourceUrl?: string;
    style?: GeoSphereFeatureStyle;
    requiredPermissions?: string[];
}
export interface GeoSphereViewport {
    center: GeoSphereCoordinate;
    zoom: number;
    rotation?: number;
    bounds?: BoundingBoxTuple;
}
export type MapMode = "view" | "select" | "draw-point" | "draw-line" | "draw-polygon" | "edit";
export interface GeoSphereMapState {
    center: GeoSphereCoordinate;
    zoom: number;
    rotation: number;
    bounds?: BoundingBoxTuple;
    selectedFeatureId: string | null;
    visibleLayerIds: string[];
    mapMode: MapMode;
    isLoading: boolean;
    error?: string;
}
export type GISMapEventType = "map.initialized" | "map.ready" | "map.click" | "map.longPress" | "map.moveStart" | "map.move" | "map.moveEnd" | "map.zoomChanged" | "feature.selected" | "feature.deselected" | "feature.created" | "feature.updated" | "feature.deleted" | "layer.visibilityChanged" | "layer.selected";
export interface GeoSphereMapEventPayload<T = unknown> {
    type: GISMapEventType;
    coordinate?: GeoSphereCoordinate;
    feature?: GeoSphereFeature;
    layer?: GeoSphereLayer;
    viewport?: GeoSphereViewport;
    data?: T;
}
export interface IGISMapAdapterContract {
    initialize(containerId: string, viewport: GeoSphereViewport): Promise<void>;
    destroy(): void;
    setViewport(viewport: Partial<GeoSphereViewport>, animate?: boolean): void;
    getViewport(): GeoSphereViewport;
    addLayer(layer: GeoSphereLayer): void;
    removeLayer(layerId: string): void;
    setLayerVisibility(layerId: string, visible: boolean): void;
    renderFeatures(layerId: string, features: GeoSphereFeature[]): void;
    clearFeatures(layerId?: string): void;
    selectFeature(featureId: string | null): void;
    fitToFeatures(features: GeoSphereFeature[], padding?: number): void;
}
export interface GeoSphereGISConfig {
    mapProvider?: string;
    initialViewport: GeoSphereViewport;
    defaultLayers?: GeoSphereLayer[];
    themePreset?: string;
    visualStyle?: string;
    locale?: string;
    embeddedMode?: boolean;
}
export declare class GeoSphereGIS {
    private config;
    private mapState;
    private layers;
    private features;
    private adapter?;
    constructor(config: GeoSphereGISConfig);
    initialize(adapter?: IGISMapAdapterContract, containerId?: string): Promise<void>;
    getMapState(): GeoSphereMapState;
    getViewport(): GeoSphereViewport;
    setViewport(viewport: Partial<GeoSphereViewport>): void;
    addLayer(layer: GeoSphereLayer): void;
    removeLayer(layerId: string): void;
    setLayerVisibility(layerId: string, visible: boolean): void;
    getLayers(): GeoSphereLayer[];
    addFeature(feature: GeoSphereFeature): void;
    updateFeature(feature: GeoSphereFeature): void;
    removeFeature(featureId: string): void;
    selectFeature(featureId: string | null): void;
    getSelectedFeature(): GeoSphereFeature | null;
    getFeatures(layerId?: string): GeoSphereFeature[];
    destroy(): void;
}
//# sourceMappingURL=gis.contracts.d.ts.map