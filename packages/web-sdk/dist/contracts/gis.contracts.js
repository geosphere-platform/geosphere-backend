/**
 * GeoSphere GIS SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral & Map Engine Independent (Zero OpenLayers/DOM Leakage)
 */
export class GeoSphereGIS {
    config;
    mapState;
    layers = new Map();
    features = new Map();
    adapter;
    constructor(config) {
        this.config = config;
        this.mapState = {
            center: config.initialViewport.center,
            zoom: config.initialViewport.zoom,
            rotation: config.initialViewport.rotation || 0,
            bounds: config.initialViewport.bounds,
            selectedFeatureId: null,
            visibleLayerIds: config.defaultLayers ? config.defaultLayers.filter((l) => l.visible).map((l) => l.id) : [],
            mapMode: "view",
            isLoading: false
        };
        if (config.defaultLayers) {
            config.defaultLayers.forEach((layer) => this.layers.set(layer.id, layer));
        }
    }
    async initialize(adapter, containerId = "geosphere-map-container") {
        this.mapState.isLoading = true;
        if (adapter) {
            this.adapter = adapter;
            await this.adapter.initialize(containerId, this.getViewport());
        }
        this.mapState.isLoading = false;
    }
    getMapState() {
        return { ...this.mapState };
    }
    getViewport() {
        return {
            center: this.mapState.center,
            zoom: this.mapState.zoom,
            rotation: this.mapState.rotation,
            bounds: this.mapState.bounds
        };
    }
    setViewport(viewport) {
        if (viewport.center)
            this.mapState.center = viewport.center;
        if (viewport.zoom !== undefined)
            this.mapState.zoom = viewport.zoom;
        if (viewport.rotation !== undefined)
            this.mapState.rotation = viewport.rotation;
        if (viewport.bounds)
            this.mapState.bounds = viewport.bounds;
        if (this.adapter) {
            this.adapter.setViewport(viewport);
        }
    }
    addLayer(layer) {
        this.layers.set(layer.id, layer);
        if (layer.visible && !this.mapState.visibleLayerIds.includes(layer.id)) {
            this.mapState.visibleLayerIds.push(layer.id);
        }
        if (this.adapter) {
            this.adapter.addLayer(layer);
        }
    }
    removeLayer(layerId) {
        this.layers.delete(layerId);
        this.mapState.visibleLayerIds = this.mapState.visibleLayerIds.filter((id) => id !== layerId);
        if (this.adapter) {
            this.adapter.removeLayer(layerId);
        }
    }
    setLayerVisibility(layerId, visible) {
        const layer = this.layers.get(layerId);
        if (layer) {
            layer.visible = visible;
            if (visible && !this.mapState.visibleLayerIds.includes(layerId)) {
                this.mapState.visibleLayerIds.push(layerId);
            }
            else if (!visible) {
                this.mapState.visibleLayerIds = this.mapState.visibleLayerIds.filter((id) => id !== layerId);
            }
            if (this.adapter) {
                this.adapter.setLayerVisibility(layerId, visible);
            }
        }
    }
    getLayers() {
        return Array.from(this.layers.values());
    }
    addFeature(feature) {
        this.features.set(feature.id, feature);
        if (this.adapter && feature.layerId) {
            this.adapter.renderFeatures(feature.layerId, [feature]);
        }
    }
    updateFeature(feature) {
        if (this.features.has(feature.id)) {
            this.features.set(feature.id, feature);
            if (this.adapter && feature.layerId) {
                this.adapter.renderFeatures(feature.layerId, Array.from(this.features.values()).filter((f) => f.layerId === feature.layerId));
            }
        }
    }
    removeFeature(featureId) {
        const feature = this.features.get(featureId);
        this.features.delete(featureId);
        if (this.mapState.selectedFeatureId === featureId) {
            this.mapState.selectedFeatureId = null;
        }
        if (this.adapter && feature?.layerId) {
            this.adapter.renderFeatures(feature.layerId, Array.from(this.features.values()).filter((f) => f.layerId === feature.layerId));
        }
    }
    selectFeature(featureId) {
        this.mapState.selectedFeatureId = featureId;
        if (this.adapter) {
            this.adapter.selectFeature(featureId);
        }
    }
    getSelectedFeature() {
        if (!this.mapState.selectedFeatureId)
            return null;
        return this.features.get(this.mapState.selectedFeatureId) || null;
    }
    getFeatures(layerId) {
        const all = Array.from(this.features.values());
        return layerId ? all.filter((f) => f.layerId === layerId) : all;
    }
    destroy() {
        if (this.adapter) {
            this.adapter.destroy();
        }
        this.layers.clear();
        this.features.clear();
    }
}
//# sourceMappingURL=gis.contracts.js.map