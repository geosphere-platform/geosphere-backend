/**
 * GeoSphere Mapping SDK Core Contracts & Multi-Platform Domain Models
 * Consumes GeoSphere GIS SDK Core Contracts (Zero Duplicate GIS Engines)
 * Framework-Neutral & Provider Independent (Zero Provider Leakage)
 */
import { GeoSphereGIS } from "./gis.contracts.js";
export class GeoSphereMapping {
    config;
    gis;
    provider;
    basemaps = new Map();
    activeBasemap;
    styles = new Map();
    activeStyle;
    controls = new Map();
    adapter;
    constructor(config) {
        this.config = config;
        // Consumes GIS Engine from Step 8 (Zero Duplicate GIS Engine)
        this.gis = new GeoSphereGIS(config.gisConfig);
        this.provider = config.provider;
        this.activeBasemap = config.defaultBasemap;
        this.basemaps.set(config.defaultBasemap.id, config.defaultBasemap);
        if (config.defaultStyle) {
            this.activeStyle = config.defaultStyle;
            this.styles.set(config.defaultStyle.id, config.defaultStyle);
        }
        if (config.controls) {
            config.controls.forEach((c) => this.controls.set(c.id, c));
        }
    }
    getGIS() {
        return this.gis;
    }
    async initialize(adapter, containerId = "geosphere-map-container") {
        if (adapter) {
            this.adapter = adapter;
            await this.adapter.initialize(containerId, this.gis.getViewport());
        }
        await this.gis.initialize(undefined, containerId);
    }
    getProvider() {
        return this.provider;
    }
    capabilities() {
        return this.provider.capabilities;
    }
    hasCapability(capability) {
        return this.provider.capabilities.includes(capability);
    }
    getAttribution() {
        const basemapAttr = this.activeBasemap.attribution || "";
        const providerAttr = this.provider.attribution || "";
        return Array.from(new Set([providerAttr, basemapAttr].filter(Boolean))).join(" | ");
    }
    addBasemap(basemap) {
        this.basemaps.set(basemap.id, basemap);
    }
    getBasemaps() {
        return Array.from(this.basemaps.values());
    }
    setBasemap(basemapId) {
        const basemap = this.basemaps.get(basemapId);
        if (basemap) {
            this.activeBasemap = basemap;
            if (this.adapter) {
                this.adapter.setBasemap(basemap);
            }
        }
    }
    getActiveBasemap() {
        return this.activeBasemap;
    }
    addMapStyle(style) {
        this.styles.set(style.id, style);
    }
    getMapStyles() {
        return Array.from(this.styles.values());
    }
    setMapStyle(styleId) {
        const style = this.styles.get(styleId);
        if (style) {
            this.activeStyle = style;
            if (this.adapter) {
                this.adapter.setMapStyle(style);
            }
        }
    }
    getActiveMapStyle() {
        return this.activeStyle;
    }
    toggleControl(controlId, enabled) {
        const control = this.controls.get(controlId);
        if (control) {
            control.enabled = enabled;
            if (this.adapter) {
                this.adapter.toggleControl(controlId, enabled);
            }
        }
    }
    getControls() {
        return Array.from(this.controls.values());
    }
    // Delegated Spatial Viewport & Feature Operations to GIS Engine
    setViewport(viewport) {
        this.gis.setViewport(viewport);
    }
    getViewport() {
        return this.gis.getViewport();
    }
    addLayer(layer) {
        this.gis.addLayer(layer);
    }
    addFeature(feature) {
        this.gis.addFeature(feature);
    }
    destroy() {
        if (this.adapter) {
            this.adapter.destroy();
        }
        this.gis.destroy();
        this.basemaps.clear();
        this.styles.clear();
        this.controls.clear();
    }
}
//# sourceMappingURL=mapping.contracts.js.map