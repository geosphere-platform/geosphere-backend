/**
 * Map Adapter Contract & Map Domain Primitive Unit Tests
 *
 * Tests map adapter contracts (IMapAdapter), viewport calculations, layer lifecycle models,
 * feature conversion, event normalization, and mock adapter injection without requiring
 * browser DOM or OpenLayers runtime.
 */

import {
  IMapAdapter,
  IFeatureRendererAdapter,
} from "../../packages/gis-map/src/adapters/map-adapter.interface";
import { BaseGISLayer } from "../../packages/gis-map/src/layers/layer";
import { VectorLayer } from "../../packages/gis-map/src/layers/vector-layer";
import { TileLayer } from "../../packages/gis-map/src/layers/tile-layer";
import { LayerManager } from "../../packages/gis-map/src/layers/layer-manager";
import { Viewport } from "../../packages/gis-map/src/view/viewport";
import { MapEventEmitter } from "../../packages/gis-map/src/events/event-emitter";
import {
  MapFeature,
  Coordinate,
  BoundingBoxTuple,
  SpatialReference,
  DrawType,
  MapControlConfig,
  MapInteractionType,
} from "../../packages/gis-map/src/types";
import { GeoJsonConverter } from "../../packages/gis-map/src/geojson/geojson-converter";
import { GeoJsonFeature } from "../../core/gis/types/geojson";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

class MockMapAdapter implements IMapAdapter {
  public initialized = false;
  public destroyed = false;
  public center: Coordinate = [77.209, 28.6139];
  public zoom = 12;
  public layers = new Map<string, BaseGISLayer>();
  public features = new Map<string, MapFeature>();
  public selectCallback: ((feature: MapFeature | null, coordinate: Coordinate) => void) | null = null;
  public hoverCallback: ((feature: MapFeature | null, coordinate: Coordinate) => void) | null = null;

  initialize(container: unknown, options: any): void {
    this.initialized = true;
  }
  destroy(): void {
    this.destroyed = true;
  }
  resize(): void {}
  getCenter(): Coordinate {
    return this.center;
  }
  setCenter(center: Coordinate): void {
    this.center = center;
  }
  getZoom(): number {
    return this.zoom;
  }
  setZoom(zoom: number): void {
    this.zoom = zoom;
  }
  getBBox(): BoundingBoxTuple {
    return [this.center[0] - 0.1, this.center[1] - 0.1, this.center[0] + 0.1, this.center[1] + 0.1];
  }
  getProjection(): SpatialReference {
    return "EPSG:4326";
  }
  addLayer(layer: BaseGISLayer): void {
    this.layers.set(layer.id, layer);
  }
  removeLayer(layerId: string): void {
    this.layers.delete(layerId);
  }
  setLayerVisibility(layerId: string, visible: boolean): void {
    const l = this.layers.get(layerId);
    if (l) l.visible = visible;
  }
  setLayerOpacity(layerId: string, opacity: number): void {
    const l = this.layers.get(layerId);
    if (l) l.opacity = opacity;
  }
  setLayerZIndex(layerId: string, zIndex: number): void {
    const l = this.layers.get(layerId);
    if (l) l.zIndex = zIndex;
  }
  renderFeatures(features: MapFeature[], layerId?: string): void {
    for (const f of features) this.features.set(f.id, f);
  }
  removeFeature(featureId: string): void {
    this.features.delete(featureId);
  }
  clearFeatures(layerId?: string): void {
    this.features.clear();
  }
  fitExtent(bbox: BoundingBoxTuple | any, padding?: number): void {}
  fitBounds(bbox: BoundingBoxTuple, padding?: number): void {}
  setBaseTile(provider: any): void {}
  open(coordinate: Coordinate, content: unknown): void {}
  close(): void {}
  setPosition(coordinate: Coordinate | undefined): void {}
  showPopup(coordinate: Coordinate, content: unknown): void {}
  closePopup(): void {}
  setControls(config: MapControlConfig): void {}
  setControlVisibility(controlName: keyof MapControlConfig, visible: boolean): void {}
  startDrawing(type: DrawType, onComplete: (geom: any) => void, onCancel?: () => void): void {}
  stopDrawing(): void {}
  startEditing(featureId: string, onUpdate: (geom: any) => void, onCancel?: () => void): void {}
  stopEditing(): void {}
  setInteraction(type: MapInteractionType, enabled: boolean): void {}
  enableInteraction(type: MapInteractionType): void {}
  disableInteraction(type: MapInteractionType): void {}
  onSelect(callback: (feature: MapFeature | null, coordinate: Coordinate) => void): void {
    this.selectCallback = callback;
  }
  onHover(callback: (feature: MapFeature | null, coordinate: Coordinate) => void): void {
    this.hoverCallback = callback;
  }
}

export function runMapAdapterUnitTests(): void {
  console.log("------------------------------------------");
  console.log("RUNNING MAP ADAPTER CONTRACT & DOMAIN TESTS");
  console.log("------------------------------------------");

  // 1. Mock Adapter Injection & Viewport Test
  console.log("  [1/6] Testing Mock IMapAdapter Dependency Injection...");
  const mockAdapter = new MockMapAdapter();
  const emitter = new MapEventEmitter();
  const viewport = new Viewport(mockAdapter, emitter);

  assert(viewport.getCenter()[0] === 77.209, "Viewport center should come from adapter");
  viewport.setCenter([77.5, 28.5]);
  assert(mockAdapter.center[0] === 77.5 && mockAdapter.center[1] === 28.5, "Viewport setCenter should update adapter");

  viewport.setZoom(15);
  assert(mockAdapter.zoom === 15, "Viewport setZoom should update adapter");

  // 2. Layer Manager Abstraction Test
  console.log("  [2/6] Testing Layer Manager & Generic Layer Lifecycle...");
  const layerManager = new LayerManager(mockAdapter, emitter);
  const vecLayer = new VectorLayer({ id: "vec-01", name: "Vector Layer Test", zIndex: 5 });
  layerManager.addLayer(vecLayer);

  assert(mockAdapter.layers.has("vec-01"), "Adapter must receive addLayer call");
  assert(layerManager.getLayer("vec-01")?.name === "Vector Layer Test", "LayerManager must index layer");

  layerManager.hideLayer("vec-01");
  assert(!vecLayer.visible, "Hiding layer must update layer visibility property");
  assert(!mockAdapter.layers.get("vec-01")?.visible, "Adapter layer visibility must reflect hidden state");

  layerManager.setOpacity("vec-01", 0.5);
  assert(vecLayer.opacity === 0.5, "Layer opacity update must set 0.5");

  layerManager.removeLayer("vec-01");
  assert(!mockAdapter.layers.has("vec-01"), "Removing layer must delegate to adapter");

  // 3. Feature Conversion Boundary Test
  console.log("  [3/6] Testing GeoJSON to MapFeature Domain Conversion...");
  const geoJsonInput: GeoJsonFeature = {
    type: "Feature",
    id: "feat-100",
    geometry: {
      type: "Point",
      coordinates: [77.209, 28.6139],
    },
    properties: {
      title: "Connaught Place",
      category: "landmark",
    },
  };

  const mapFeature = GeoJsonConverter.featureToMapFeature(geoJsonInput);
  assert(mapFeature.id === "feat-100", "MapFeature id must be preserved");
  assert(mapFeature.geometry.type === "Point", "MapFeature geometry type must be Point");
  assert((mapFeature.geometry as any).coordinates[0] === 77.209, "MapFeature coordinates must match input");
  assert(mapFeature.properties?.title === "Connaught Place", "Properties metadata must be preserved");

  // 4. Feature Rendering Delegation Test
  console.log("  [4/6] Testing Feature Renderer Adapter Calls...");
  mockAdapter.renderFeatures([mapFeature], "layer-test");
  assert(mockAdapter.features.has("feat-100"), "Feature rendering must update adapter features map");

  mockAdapter.removeFeature("feat-100");
  assert(!mockAdapter.features.has("feat-100"), "Feature removal must clear adapter entry");

  // 5. Event Normalization Test
  console.log("  [5/6] Testing Event Normalization & Select Callbacks...");
  let selectedId = "";
  mockAdapter.onSelect((feat, coord) => {
    if (feat) selectedId = feat.id;
  });

  if (mockAdapter.selectCallback) {
    mockAdapter.selectCallback(mapFeature, [77.209, 28.6139]);
  }
  assert(selectedId === "feat-100", "Select callback must deliver normalized GeoSphere MapFeature");

  // 6. Generic Layer Types (TileLayer & VectorLayer)
  console.log("  [6/6] Testing TileLayer & Generic Layer Contracts...");
  const tileLayer = new TileLayer(
    {
      id: "osm-tile",
      name: "OpenStreetMap Base",
    },
    "osm",
  );
  assert(tileLayer.type === "tile", "TileLayer type must be 'tile'");
  assert(tileLayer.provider === "osm", "Tile provider type must be 'osm'");

  console.log("✅ Map Adapter Contract & Domain Unit Tests Passed Successfully!");
}
