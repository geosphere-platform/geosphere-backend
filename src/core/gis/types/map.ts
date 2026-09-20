/**
 * GIS Core — Generic Map Abstraction Interfaces
 *
 * Abstract contracts for map engines (OpenLayers, Leaflet, Mapbox, etc.).
 * UI components interact with these generic contracts without hardcoding map engine internals.
 */

import { Coordinate, SpatialReference } from "./geometry";
import { BoundingBox } from "../bbox/bounding-box";
import { SpatialEntity } from "./entity";

export type BaseMapTileProvider =
  "osm" | "carto_light" | "carto_dark" | "satellite";

export interface MapViewConfig {
  center: Coordinate;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  projection?: SpatialReference;
  baseTile?: BaseMapTileProvider;
}

export interface MapMarkerStyle {
  color?: string;
  iconUrl?: string;
  size?: number;
  label?: string;
  rotation?: number;
}

export interface ClusterStyleConfig {
  enabled: boolean;
  distance?: number; // Distance in pixels within which features are clustered
  minClusterSize?: number;
  clusterColor?: string;
}

export interface MapLayerConfig {
  id: string;
  name: string;
  visible: boolean;
  opacity?: number;
  zIndex?: number;
  clusterConfig?: ClusterStyleConfig;
}

export interface MapFeatureData<
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  coordinate: Coordinate;
  properties: P;
  style?: MapMarkerStyle;
  entityType?: string;
}

export interface MapInteractionEvent<
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  type: "click" | "hover" | "select";
  coordinate: Coordinate;
  feature: MapFeatureData<P> | null;
}

/**
 * Contract for a GIS Map Engine Adapter
 */
export interface IGISMapAdapter {
  initialize(containerElement: HTMLElement, config: MapViewConfig): void;
  destroy(): void;
  setCenter(center: Coordinate, animate?: boolean): void;
  setZoom(zoom: number, animate?: boolean): void;
  zoomToExtent(bbox: BoundingBox, padding?: number): void;
  setTileLayer(tile: BaseMapTileProvider): void;
  renderEntities(entities: SpatialEntity[]): void;
  clearEntities(): void;
  onFeatureSelect(callback: (feature: MapFeatureData | null) => void): void;
}
