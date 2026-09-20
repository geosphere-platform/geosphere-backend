/**
 * GIS Map SDK — Main GISMap Class
 *
 * Primary entrypoint abstraction wrapping OpenLayers Adapter.
 * Does NOT expose raw OpenLayers objects to callers.
 */

import {
  MapOptions,
  Coordinate,
  BoundingBoxTuple,
  MapFeature,
  MapMarker,
  BaseTileProvider,
  DrawType,
  MapEventType,
  MapEventListener,
  MapEventPayloadMap,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  MeasurementResult,
  MeasurementUnitLength,
  MeasurementUnitArea,
} from "../types";
import { createMapOptions } from "./options";
import { Viewport } from "../view/viewport";
import { LayerManager } from "../layers/layer-manager";
import { FeatureManager } from "../features/feature-manager";
import { SelectionManager } from "../selection/selection-manager";
import { MapPopup } from "../popup/popup";
import { MapControlManager } from "../controls/controls";
import { DrawingManager } from "../drawing/drawing-manager";
import { EditingManager } from "../editing/editing-manager";
import { InteractionManager } from "../interactions/interaction";
import { MapEventEmitter } from "../events/event-emitter";
import { OpenLayersAdapter } from "../adapters/openlayers/openlayers-adapter";
import { IMapAdapter } from "../adapters/map-adapter.interface";
import { markerToFeature } from "../markers/marker";
import { GeoJsonConverter } from "../geojson/geojson-converter";
import { JurisdictionEngine } from "../jurisdiction/jurisdiction-engine";
import { MapProfileManager, BusinessProfileType } from "../profiles/profile-manager";
import { MeasurementEngine } from "../measurement/measurement";
import { StructuredMapError } from "../errors/map-errors";

export class GISMap {
  public readonly id: string;
  private adapter: IMapAdapter;
  private emitter: MapEventEmitter;

  public readonly viewport: Viewport;
  public readonly layers: LayerManager;
  public readonly features: FeatureManager;
  public readonly selection: SelectionManager;
  public readonly popup: MapPopup;
  public readonly controls: MapControlManager;
  public readonly drawing: DrawingManager;
  public readonly editing: EditingManager;
  public readonly interactions: InteractionManager;
  public readonly jurisdiction: JurisdictionEngine;
  public readonly profile: MapProfileManager;

  private isInitialized: boolean = false;

  constructor(options?: Partial<MapOptions> & { adapter?: IMapAdapter }, id?: string) {
    this.id = id ?? `gis-map-${Math.random().toString(36).substring(2, 9)}`;
    this.emitter = new MapEventEmitter();
    this.adapter = options?.adapter ?? new OpenLayersAdapter();

    this.viewport = new Viewport(this.adapter, this.emitter);
    this.layers = new LayerManager(this.adapter, this.emitter);
    this.features = new FeatureManager(this.emitter);
    this.selection = new SelectionManager(this.emitter);
    this.popup = new MapPopup(this.adapter);
    this.controls = new MapControlManager(this.adapter, options?.controls);
    this.drawing = new DrawingManager(this.adapter, this.emitter);
    this.editing = new EditingManager(this.adapter, this.emitter);
    this.interactions = new InteractionManager(this.adapter);
    this.jurisdiction = new JurisdictionEngine();
    this.profile = new MapProfileManager();

    // Setup adapter selection/hover listeners
    this.adapter.onSelect((feat, coord) => {
      this.selection.selectFeature(feat, coord);
    });
    this.adapter.onHover((feat, coord) => {
      this.selection.hoverFeature(feat, coord);
    });

    // Re-render features on layer/feature updates
    this.emitter.on("featureAdded", ({ feature }) => {
      this.adapter.renderFeatures([feature], feature.layerId);
    });
    this.emitter.on("featureUpdated", ({ feature }) => {
      this.adapter.renderFeatures([feature], feature.layerId);
    });
    this.emitter.on("featureRemoved", ({ featureId }) => {
      this.adapter.removeFeature(featureId);
    });
  }

  public initialize(
    container: HTMLElement,
    options?: Partial<MapOptions>,
  ): void {
    if (this.isInitialized) return;
    const mapOpts = createMapOptions(options);

    try {
      this.adapter.initialize(container, mapOpts);
      this.isInitialized = true;
      this.emitter.emit("mapReady", { mapId: this.id });
    } catch (err) {
      throw new StructuredMapError(
        "MAP_INITIALIZATION_FAILED",
        "Failed to initialize GIS Map engine",
        { error: err },
      );
    }
  }

  public destroy(): void {
    if (!this.isInitialized) return;
    this.adapter.destroy();
    this.emitter.emit("mapDestroyed", { mapId: this.id });
    this.emitter.removeAllListeners();
    this.isInitialized = false;
  }

  public resize(): void {
    if (this.isInitialized) {
      this.adapter.resize();
    }
  }

  // --- Convenience Shortcuts ---

  public getCenter(): Coordinate {
    return this.viewport.getCenter();
  }

  public setCenter(center: Coordinate, animate: boolean = true): void {
    this.viewport.setCenter(center, animate);
  }

  public getZoom(): number {
    return this.viewport.getZoom();
  }

  public setZoom(zoom: number, animate: boolean = true): void {
    this.viewport.setZoom(zoom, animate);
  }

  public setCenterAndZoom(
    center: Coordinate,
    zoom: number,
    animate: boolean = true,
  ): void {
    this.setCenter(center, animate);
    this.setZoom(zoom, animate);
  }

  public fitExtent(bbox: BoundingBoxTuple | any, padding: number = 40): void {
    this.viewport.fitExtent(bbox, padding);
  }

  public fitBounds(bounds: BoundingBoxTuple, padding: number = 40): void {
    this.viewport.fitExtent(bounds, padding);
  }

  public fitFeature(featureId: string, padding: number = 40): void {
    const feat = this.features.getFeature(featureId);
    if (feat && feat.geometry) {
      if (feat.geometry.type === "Point") {
        this.setCenter(feat.geometry.coordinates as Coordinate);
        this.setZoom(16);
      }
    }
  }

  public fitLayer(layerId: string, padding: number = 40): void {
    const layerFeatures = this.features.getFeatures().filter((f: MapFeature) => f.layerId === layerId);
    if (layerFeatures.length > 0) {
      const coords = layerFeatures
        .filter((f: MapFeature) => f.geometry.type === "Point")
        .map((f: MapFeature) => f.geometry.coordinates as Coordinate);
      if (coords.length > 0) {
        const lats = coords.map((c: Coordinate) => c[1]);
        const lngs = coords.map((c: Coordinate) => c[0]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        this.fitBounds([minLng, minLat, maxLng, maxLat], padding);
      }
    }
  }

  public setBaseTile(provider: BaseTileProvider): void {
    this.adapter.setBaseTile(provider);
  }

  // --- Marker API ---

  public addMarker(marker: MapMarker, layerId?: string): void {
    const feat = markerToFeature(marker);
    if (layerId) feat.layerId = layerId;
    this.features.addFeature(feat);
  }

  public updateMarker(marker: MapMarker, layerId?: string): void {
    const feat = markerToFeature(marker);
    if (layerId) feat.layerId = layerId;
    this.features.updateFeature(feat);
  }

  public removeMarker(id: string): void {
    this.features.removeFeature(id);
  }

  // --- GeoJSON API ---

  public addGeoJSON(
    data: GeoJsonFeature | GeoJsonFeatureCollection,
    layerId?: string,
  ): MapFeature[] {
    let mapFeatures: MapFeature[] = [];
    if (data.type === "Feature") {
      mapFeatures = [
        GeoJsonConverter.featureToMapFeature(data as GeoJsonFeature),
      ];
    } else if (data.type === "FeatureCollection") {
      mapFeatures = GeoJsonConverter.featureCollectionToMapFeatures(
        data as GeoJsonFeatureCollection,
      );
    }
    if (layerId) {
      mapFeatures.forEach((f) => (f.layerId = layerId));
    }
    this.features.addFeatures(mapFeatures);
    return mapFeatures;
  }

  // --- Measurement API ---

  public measureDistance(
    coordinates: Coordinate[],
    unit: MeasurementUnitLength = "meters",
  ): MeasurementResult {
    return MeasurementEngine.measureDistance(coordinates, unit);
  }

  public measureArea(
    coordinates: Coordinate[][],
    unit: MeasurementUnitArea = "squareMeters",
  ): MeasurementResult {
    return MeasurementEngine.measureArea(coordinates, unit);
  }

  // --- Event Listener Binding ---

  public on<K extends MapEventType>(
    event: K,
    listener: MapEventListener<K>,
  ): () => void {
    return this.emitter.on(event, listener);
  }

  public off<K extends MapEventType>(
    event: K,
    listener: MapEventListener<K>,
  ): void {
    this.emitter.off(event, listener);
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
}
