/**
 * GeoSphere Mapping SDK Core Contracts & Multi-Platform Domain Models
 * Consumes GeoSphere GIS SDK Core Contracts (Zero Duplicate GIS Engines)
 * Framework-Neutral & Provider Independent (Zero Provider Leakage)
 */
import { GeoSphereGIS, GeoSphereGISConfig, GeoSphereViewport, GeoSphereLayer, GeoSphereFeature } from "./gis.contracts.js";
export type GeoSphereMapProviderType = "openlayers" | "maplibre" | "mapbox" | "google-maps" | "leaflet" | "custom";
export type GeoSphereMapCapability = "TILE_MAP" | "VECTOR_TILES" | "SATELLITE" | "TERRAIN" | "ROTATION" | "PITCH" | "CLUSTERING" | "OFFLINE_MAPS" | "THREE_D" | "GEOCODING" | "STYLING";
export interface GeoSphereMapProvider {
    id: string;
    name: string;
    type: GeoSphereMapProviderType;
    capabilities: GeoSphereMapCapability[];
    attribution: string;
}
export type GeoSphereBasemapCategory = "streets" | "satellite" | "hybrid" | "terrain" | "dark" | "light" | "custom";
export interface GeoSphereBasemap {
    id: string;
    name: string;
    category: GeoSphereBasemapCategory;
    providerType: GeoSphereMapProviderType;
    tileUrlPattern?: string;
    thumbnailUrl?: string;
    attribution: string;
    requiredCapability?: GeoSphereMapCapability;
}
export type GeoSphereMapStyleCategory = "light" | "dark" | "satellite" | "navigation" | "custom";
export interface GeoSphereMapStyle {
    id: string;
    name: string;
    category: GeoSphereMapStyleCategory;
    styleUrl?: string;
    tokens?: Record<string, string>;
}
export type ControlType = "zoom" | "compass" | "scale" | "fullscreen" | "locate" | "layer" | "basemap" | "style" | "legend" | "search" | "settings";
export type ControlPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export interface GeoSphereMapControl {
    id: string;
    type: ControlType;
    position: ControlPosition;
    enabled: boolean;
}
export interface IMappingAdapterContract {
    initialize(containerId: string, viewport: GeoSphereViewport): Promise<void>;
    destroy(): void;
    setBasemap(basemap: GeoSphereBasemap): void;
    setMapStyle(style: GeoSphereMapStyle): void;
    toggleControl(controlId: string, enabled: boolean): void;
}
export interface GeoSphereMappingConfig {
    gisConfig: GeoSphereGISConfig;
    provider: GeoSphereMapProvider;
    defaultBasemap: GeoSphereBasemap;
    defaultStyle?: GeoSphereMapStyle;
    controls?: GeoSphereMapControl[];
    embeddedMode?: boolean;
}
export declare class GeoSphereMapping {
    private config;
    private gis;
    private provider;
    private basemaps;
    private activeBasemap;
    private styles;
    private activeStyle?;
    private controls;
    private adapter?;
    constructor(config: GeoSphereMappingConfig);
    getGIS(): GeoSphereGIS;
    initialize(adapter?: IMappingAdapterContract, containerId?: string): Promise<void>;
    getProvider(): GeoSphereMapProvider;
    capabilities(): GeoSphereMapCapability[];
    hasCapability(capability: GeoSphereMapCapability): boolean;
    getAttribution(): string;
    addBasemap(basemap: GeoSphereBasemap): void;
    getBasemaps(): GeoSphereBasemap[];
    setBasemap(basemapId: string): void;
    getActiveBasemap(): GeoSphereBasemap;
    addMapStyle(style: GeoSphereMapStyle): void;
    getMapStyles(): GeoSphereMapStyle[];
    setMapStyle(styleId: string): void;
    getActiveMapStyle(): GeoSphereMapStyle | undefined;
    toggleControl(controlId: string, enabled: boolean): void;
    getControls(): GeoSphereMapControl[];
    setViewport(viewport: Partial<GeoSphereViewport>): void;
    getViewport(): GeoSphereViewport;
    addLayer(layer: GeoSphereLayer): void;
    addFeature(feature: GeoSphereFeature): void;
    destroy(): void;
}
//# sourceMappingURL=mapping.contracts.d.ts.map