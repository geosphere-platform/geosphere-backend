/**
 * GeoSphere GIS SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral & Map Engine Independent (Zero OpenLayers/DOM Leakage)
 */

export type SpatialReference = "EPSG:4326" | "EPSG:3857" | string;

export type GeoSphereCoordinate = [number, number, number?];

export type BoundingBoxTuple = [number, number, number, number];

export type GeoSphereGeometryType =
  | "Point"
  | "LineString"
  | "Polygon"
  | "MultiPoint"
  | "MultiLineString"
  | "MultiPolygon"
  | "GeometryCollection";

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

export type GeoSphereGeometry =
  | PointGeometry
  | LineStringGeometry
  | PolygonGeometry
  | MultiPointGeometry
  | MultiLineStringGeometry
  | MultiPolygonGeometry
  | GeometryCollection;

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

export type GISMapEventType =
  | "map.initialized"
  | "map.ready"
  | "map.click"
  | "map.longPress"
  | "map.moveStart"
  | "map.move"
  | "map.moveEnd"
  | "map.zoomChanged"
  | "feature.selected"
  | "feature.deselected"
  | "feature.created"
  | "feature.updated"
  | "feature.deleted"
  | "layer.visibilityChanged"
  | "layer.selected";

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

export class GeoSphereGIS {
  private mapState: GeoSphereMapState;
  private layers: Map<string, GeoSphereLayer> = new Map();
  private features: Map<string, GeoSphereFeature> = new Map();
  private adapter?: IGISMapAdapterContract;

  constructor(private config: GeoSphereGISConfig) {
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

  public async initialize(adapter?: IGISMapAdapterContract, containerId: string = "geosphere-map-container"): Promise<void> {
    this.mapState.isLoading = true;
    if (adapter) {
      this.adapter = adapter;
      await this.adapter.initialize(containerId, this.getViewport());
    }
    this.mapState.isLoading = false;
  }

  public getMapState(): GeoSphereMapState {
    return { ...this.mapState };
  }

  public getViewport(): GeoSphereViewport {
    return {
      center: this.mapState.center,
      zoom: this.mapState.zoom,
      rotation: this.mapState.rotation,
      bounds: this.mapState.bounds
    };
  }

  public setViewport(viewport: Partial<GeoSphereViewport>): void {
    if (viewport.center) this.mapState.center = viewport.center;
    if (viewport.zoom !== undefined) this.mapState.zoom = viewport.zoom;
    if (viewport.rotation !== undefined) this.mapState.rotation = viewport.rotation;
    if (viewport.bounds) this.mapState.bounds = viewport.bounds;

    if (this.adapter) {
      this.adapter.setViewport(viewport);
    }
  }

  public addLayer(layer: GeoSphereLayer): void {
    this.layers.set(layer.id, layer);
    if (layer.visible && !this.mapState.visibleLayerIds.includes(layer.id)) {
      this.mapState.visibleLayerIds.push(layer.id);
    }
    if (this.adapter) {
      this.adapter.addLayer(layer);
    }
  }

  public removeLayer(layerId: string): void {
    this.layers.delete(layerId);
    this.mapState.visibleLayerIds = this.mapState.visibleLayerIds.filter((id) => id !== layerId);
    if (this.adapter) {
      this.adapter.removeLayer(layerId);
    }
  }

  public setLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.visible = visible;
      if (visible && !this.mapState.visibleLayerIds.includes(layerId)) {
        this.mapState.visibleLayerIds.push(layerId);
      } else if (!visible) {
        this.mapState.visibleLayerIds = this.mapState.visibleLayerIds.filter((id) => id !== layerId);
      }
      if (this.adapter) {
        this.adapter.setLayerVisibility(layerId, visible);
      }
    }
  }

  public getLayers(): GeoSphereLayer[] {
    return Array.from(this.layers.values());
  }

  public addFeature(feature: GeoSphereFeature): void {
    this.features.set(feature.id, feature);
    if (this.adapter && feature.layerId) {
      this.adapter.renderFeatures(feature.layerId, [feature]);
    }
  }

  public updateFeature(feature: GeoSphereFeature): void {
    if (this.features.has(feature.id)) {
      this.features.set(feature.id, feature);
      if (this.adapter && feature.layerId) {
        this.adapter.renderFeatures(feature.layerId, Array.from(this.features.values()).filter((f) => f.layerId === feature.layerId));
      }
    }
  }

  public removeFeature(featureId: string): void {
    const feature = this.features.get(featureId);
    this.features.delete(featureId);
    if (this.mapState.selectedFeatureId === featureId) {
      this.mapState.selectedFeatureId = null;
    }
    if (this.adapter && feature?.layerId) {
      this.adapter.renderFeatures(feature.layerId, Array.from(this.features.values()).filter((f) => f.layerId === feature.layerId));
    }
  }

  public selectFeature(featureId: string | null): void {
    this.mapState.selectedFeatureId = featureId;
    if (this.adapter) {
      this.adapter.selectFeature(featureId);
    }
  }

  public getSelectedFeature(): GeoSphereFeature | null {
    if (!this.mapState.selectedFeatureId) return null;
    return this.features.get(this.mapState.selectedFeatureId) || null;
  }

  public getFeatures(layerId?: string): GeoSphereFeature[] {
    const all = Array.from(this.features.values());
    return layerId ? all.filter((f) => f.layerId === layerId) : all;
  }

  public destroy(): void {
    if (this.adapter) {
      this.adapter.destroy();
    }
    this.layers.clear();
    this.features.clear();
  }
}
