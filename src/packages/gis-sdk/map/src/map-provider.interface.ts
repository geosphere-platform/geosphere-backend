import {
  Coordinates,
  BoundingBox,
  GeoJSONFeature,
  GeoJSONGeometry,
} from "@gis-sdk/core";

export type MapEventType =
  "click" | "pointermove" | "movestart" | "moveend" | "zoomend";

export interface MapOptions {
  target: HTMLElement | string;
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  rotation?: number;
  pitch?: number;
}

export interface LayerConfig {
  id: string;
  name: string;
  type:
    | "vector"
    | "tile"
    | "raster"
    | "geojson"
    | "heatmap"
    | "cluster"
    | "marker"
    | "geometry"
    | "vector-tile";
  url?: string;
  data?: any;
  visible?: boolean;
  opacity?: number;
  zIndex?: number;
  style?: Record<string, any>;
}

export interface IMapProvider {
  initialize(options: MapOptions): void;
  destroy(): void;
  setCenter(coordinates: Coordinates): void;
  getCenter(): Coordinates;
  setZoom(zoom: number): void;
  getZoom(): number;
  fitBounds(bounds: BoundingBox): void;
  getBounds(): BoundingBox;
  setRotation(rotation: number): void;
  getRotation(): number;

  // Layer Operations
  addLayer(config: LayerConfig): void;
  removeLayer(layerId: string): void;
  updateLayer(layerId: string, updates: Partial<LayerConfig>): void;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerOpacity(layerId: string, opacity: number): void;

  // Feature / Drawing Operations
  addFeature(layerId: string, feature: GeoJSONFeature): void;
  removeFeature(layerId: string, featureId: string | number): void;
  clearFeatures(layerId: string): void;

  // Event Registration
  on(event: MapEventType, callback: (payload: any) => void): () => void;

  // Native map element reference
  getNativeMap(): any;
}
