/**
 * GIS Map SDK — Public TypeScript Definitions
 *
 * Business-agnostic generic GIS types and contracts.
 */

import {
  Coordinate,
  SpatialReference,
  Geometry,
  PointGeometry,
  BoundingBoxTuple,
} from "../../../../core/gis/types/geometry";
import {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
} from "../../../../core/gis/types/geojson";

export type {
  Coordinate,
  SpatialReference,
  Geometry,
  PointGeometry,
  BoundingBoxTuple,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
};

export type BaseTileProvider =
  | "standard"
  | "light"
  | "dark"
  | "satellite"
  | "terrain"
  | "topographic"
  | "osm"
  | "carto_light"
  | "carto_dark";

export interface FeatureStyle {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  strokeDashArray?: number[];
  circleRadius?: number;
  iconUrl?: string;
  iconScale?: number;
  iconRotation?: number; // radians or degrees
  label?: string;
  labelColor?: string;
  labelFont?: string;
  labelOffsetY?: number;
  zIndex?: number;
}

export interface MapMarker {
  id: string;
  coordinate: Coordinate;
  title?: string;
  icon?: string;
  rotation?: number;
  scale?: number;
  visible?: boolean;
  style?: FeatureStyle;
  metadata?: Record<string, unknown>;
}

export type FeatureState =
  | "default"
  | "hover"
  | "selected"
  | "highlighted"
  | "disabled"
  | "editing";

export interface MapFeature<
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  geometry: Geometry;
  properties: P;
  style?: FeatureStyle;
  layerId?: string;
  visible?: boolean;
  state?: FeatureState;
}

export type LayerType = "vector" | "tile" | "cluster" | "heatmap" | "raster";

export interface GISLayerConfig {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  zIndex: number;
  minZoom?: number;
  maxZoom?: number;
  metadata?: Record<string, unknown>;
}

export interface PointClusterOptions {
  enabled: boolean;
  distance?: number; // In pixels
  minClusterSize?: number;
  clusterColor?: string;
  textColor?: string;
}

export interface HeatmapLayerOptions {
  weightProperty?: string;
  radius?: number; // In pixels
  blur?: number; // In pixels
  opacity?: number;
}

export interface MapControlConfig {
  zoom?: boolean;
  fullscreen?: boolean;
  scale?: boolean;
  attribution?: boolean;
}

export interface MapOptions {
  center: Coordinate;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  projection?: SpatialReference;
  baseTile?: BaseTileProvider;
  controls?: MapControlConfig;
}

export interface ViewportState {
  center: Coordinate;
  zoom: number;
  bbox: BoundingBoxTuple;
  projection: SpatialReference;
}

export type MeasurementUnitLength = "meters" | "kilometers" | "feet" | "miles";
export type MeasurementUnitArea =
  | "squareMeters"
  | "hectares"
  | "squareKilometers"
  | "squareFeet"
  | "squareMiles";

export interface MeasurementResult {
  value: number;
  unit: MeasurementUnitLength | MeasurementUnitArea;
  geometry: Geometry;
  formatted: string;
}

export type DrawType = "Point" | "LineString" | "Polygon";

export type MapInteractionType =
  "pan" | "zoom" | "select" | "hover" | "draw" | "edit";

export type MapEventType =
  | "mapReady"
  | "mapDestroyed"
  | "viewportChanged"
  | "zoomChanged"
  | "centerChanged"
  | "onRotate"
  | "onPointerMove"
  | "onError"
  | "layerAdded"
  | "layerRemoved"
  | "layerVisibilityChanged"
  | "layerUpdated"
  | "layerOrderChanged"
  | "featureAdded"
  | "featureUpdated"
  | "featureRemoved"
  | "featureSelected"
  | "featureDeselected"
  | "featureHovered"
  | "drawStarted"
  | "drawCompleted"
  | "drawCancelled"
  | "editStarted"
  | "editCompleted"
  | "editCancelled";

export interface MapEventPayloadMap {
  mapReady: { mapId: string };
  mapDestroyed: { mapId: string };
  viewportChanged: ViewportState;
  zoomChanged: { zoom: number };
  centerChanged: { center: Coordinate };
  onRotate: { rotation: number };
  onPointerMove: { coordinate: Coordinate; pixel: [number, number] };
  onError: { code: string; message: string; details?: unknown };
  layerAdded: { layerId: string; layer: GISLayerConfig };
  layerRemoved: { layerId: string };
  layerVisibilityChanged: { layerId: string; visible: boolean };
  layerUpdated: { layerId: string; layer: GISLayerConfig };
  layerOrderChanged: { layerIds: string[] };
  featureAdded: { feature: MapFeature };
  featureUpdated: { feature: MapFeature };
  featureRemoved: { featureId: string };
  featureSelected: { feature: MapFeature | null; coordinate: Coordinate };
  featureDeselected: { featureId?: string };
  featureHovered: { feature: MapFeature | null; coordinate: Coordinate };
  drawStarted: { type: DrawType };
  drawCompleted: { geometry: Geometry; feature: MapFeature };
  drawCancelled: void;
  editStarted: { featureId: string };
  editCompleted: { featureId: string; geometry: Geometry };
  editCancelled: { featureId: string };
}

export type MapEventListener<K extends MapEventType> = (
  payload: MapEventPayloadMap[K],
) => void;

export interface MapDataSource {
  id: string;
  name: string;
  loadFeaturesForViewport?: (
    bbox: BoundingBoxTuple,
    zoom: number,
  ) => Promise<MapFeature[]>;
  getFeatures?: () => MapFeature[];
}
