/**
 * Framework-Independent Map Adapter Contract (IMapAdapter)
 *
 * Defines renderer-agnostic map operations (viewports, layer management, feature rendering,
 * popups, drawing, interactions) operating purely on GeoSphere GIS types.
 *
 * MUST NOT import OpenLayers, Leaflet, Mapbox, React, or browser-specific rendering frameworks.
 */

import {
  MapOptions,
  Coordinate,
  BoundingBoxTuple,
  MapFeature,
  BaseTileProvider,
} from "../types";
import { IViewportAdapter } from "../view/viewport";
import { ILayerAdapter } from "../layers/layer-manager";
import { IPopupAdapter } from "../popup/popup";
import { IControlAdapter } from "../controls/controls";
import { IDrawingAdapter } from "../drawing/drawing-manager";
import { IEditingAdapter } from "../editing/editing-manager";
import { IInteractionAdapter } from "../interactions/interaction";

export interface IFeatureRendererAdapter {
  renderFeatures(features: MapFeature[], layerId?: string): void;
  removeFeature(featureId: string): void;
  clearFeatures(layerId?: string): void;
  setBaseTile(provider: BaseTileProvider): void;
}

export interface IMapAdapter
  extends IViewportAdapter,
    ILayerAdapter,
    IPopupAdapter,
    IControlAdapter,
    IDrawingAdapter,
    IEditingAdapter,
    IInteractionAdapter,
    IFeatureRendererAdapter {
  initialize(container: unknown, options: MapOptions): void;
  destroy(): void;
  resize(): void;
  onSelect(callback: (feature: MapFeature | null, coordinate: Coordinate) => void): void;
  onHover(callback: (feature: MapFeature | null, coordinate: Coordinate) => void): void;
}
