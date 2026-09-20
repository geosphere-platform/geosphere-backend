/**
 * GIS Map SDK — OpenLayers Adapter Implementation
 *
 * Encapsulates ALL OpenLayers internal classes (ol/Map, ol/View, ol/Feature, ol/source, ol/layer, ol/style, ol/geom, etc.)
 * behind generic SDK interface boundaries.
 */

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import HeatmapLayer from "ol/layer/Heatmap";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";
import ClusterSource from "ol/source/Cluster";
import Feature from "ol/Feature";
import Geometry from "ol/geom/Geometry";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import MultiPoint from "ol/geom/MultiPoint";
import MultiLineString from "ol/geom/MultiLineString";
import MultiPolygon from "ol/geom/MultiPolygon";
import Overlay from "ol/Overlay";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import ScaleLine from "ol/control/ScaleLine";
import FullScreen from "ol/control/FullScreen";
import Zoom from "ol/control/Zoom";
import Attribution from "ol/control/Attribution";
import { fromLonLat, toLonLat } from "ol/proj";
import {
  Style,
  Circle as CircleStyle,
  Fill,
  Stroke,
  Text,
  Icon,
} from "ol/style";

import {
  MapOptions,
  Coordinate,
  BoundingBoxTuple,
  SpatialReference,
  MapFeature,
  FeatureStyle,
  BaseTileProvider,
  DrawType,
  MapControlConfig,
  MapInteractionType,
  Geometry as CoreGeometry,
} from "../../types";
import { BaseGISLayer } from "../../layers/layer";
import { VectorLayer as SDKVectorLayer } from "../../layers/vector-layer";
import { TileLayer as SDKTileLayer } from "../../layers/tile-layer";
import { ClusterLayer as SDKClusterLayer } from "../../layers/cluster-layer";
import { HeatmapLayer as SDKHeatmapLayer } from "../../layers/heatmap-layer";
import { IViewportAdapter } from "../../view/viewport";
import { ILayerAdapter } from "../../layers/layer-manager";
import { IPopupAdapter } from "../../popup/popup";
import { IControlAdapter } from "../../controls/controls";
import { IDrawingAdapter } from "../../drawing/drawing-manager";
import { IEditingAdapter } from "../../editing/editing-manager";
import { IInteractionAdapter } from "../../interactions/interaction";
import { StructuredMapError } from "../../errors/map-errors";
import { IMapAdapter } from "../map-adapter.interface";

export class OpenLayersAdapter implements IMapAdapter {
  private map: Map | null = null;
  private targetElement: HTMLElement | null = null;
  private defaultTileLayer: TileLayer<OSM | XYZ> | null = null;
  private defaultVectorSource: VectorSource | null = null;
  private defaultVectorLayer: VectorLayer<VectorSource> | null = null;

  private layersMap: globalThis.Map<
    string,
    { layer: any; source: VectorSource | ClusterSource | null }
  > = new globalThis.Map();
  private featuresMap: globalThis.Map<string, Feature> = new globalThis.Map();

  private overlay: Overlay | null = null;
  private activeDrawInteraction: Draw | null = null;
  private activeModifyInteraction: Modify | null = null;

  // Callbacks for map interaction events
  private selectCallback:
    ((feature: MapFeature | null, coordinate: Coordinate) => void) | null =
    null;
  private hoverCallback:
    ((feature: MapFeature | null, coordinate: Coordinate) => void) | null =
    null;

  public initialize(container: HTMLElement, options: MapOptions): void {
    this.targetElement = container;
    this.defaultVectorSource = new VectorSource();
    this.defaultVectorLayer = new VectorLayer({
      source: this.defaultVectorSource,
      style: (feat) => this.convertStyleToOl(feat.get("sdkFeature")?.style),
    });

    this.defaultTileLayer = new TileLayer({
      source: this.createTileSource(options.baseTile ?? "osm"),
    });

    const centerCoords = fromLonLat(options.center as [number, number]);

    const mapTarget =
      typeof document !== "undefined" &&
      container &&
      typeof container.addEventListener === "function"
        ? container
        : undefined;

    this.map = new Map({
      target: mapTarget,
      layers: [this.defaultTileLayer, this.defaultVectorLayer],
      controls: [], // We handle controls via SDK controls manager
      view: new View({
        center: centerCoords,
        zoom: options.zoom,
        minZoom: options.minZoom ?? 1,
        maxZoom: options.maxZoom ?? 20,
      }),
    });

    // Default Overlay Setup
    if (typeof document !== "undefined") {
      const overlayDiv = document.createElement("div");
      overlayDiv.className = "ol-sdk-popup-overlay";
      this.overlay = new Overlay({
        element: overlayDiv,
        autoPan: false,
      });
      this.map.addOverlay(this.overlay);
    }

    // Initial controls configuration
    this.setControls(
      options.controls ?? {
        zoom: true,
        fullscreen: true,
        scale: true,
        attribution: true,
      },
    );

    // Event listener binding
    this.setupEventListeners();
  }

  public destroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
      this.map.dispose();
      this.map = null;
    }
    this.defaultTileLayer = null;
    this.defaultVectorSource = null;
    this.defaultVectorLayer = null;
    this.layersMap.clear();
    this.featuresMap.clear();
    this.overlay = null;
    this.selectCallback = null;
    this.hoverCallback = null;
  }

  public resize(): void {
    if (this.map) {
      this.map.updateSize();
    }
  }

  // --- Viewport Adapter Implementation ---

  public getCenter(): Coordinate {
    if (!this.map) return [0, 0];
    const center = this.map.getView().getCenter();
    if (
      !center ||
      !Array.isArray(center) ||
      center.length < 2 ||
      !isFinite(center[0])
    )
      return [0, 0];
    try {
      const lonLat = toLonLat(center);
      if (lonLat && isFinite(lonLat[0]) && isFinite(lonLat[1])) {
        return [Number(lonLat[0].toFixed(6)), Number(lonLat[1].toFixed(6))];
      }
    } catch (e) {}
    return [0, 0];
  }

  public setCenter(center: Coordinate, animate: boolean = true): void {
    if (!this.map || !center) return;
    try {
      const coords = fromLonLat(center as [number, number]);
      const view = this.map.getView();
      if (animate) {
        view.animate({ center: coords, duration: 400 });
      } else {
        view.setCenter(coords);
      }
    } catch (e) {}
  }

  public getZoom(): number {
    return this.map?.getView().getZoom() ?? 2;
  }

  public setZoom(zoom: number, animate: boolean = true): void {
    if (!this.map) return;
    const view = this.map.getView();
    if (animate) {
      view.animate({ zoom, duration: 300 });
    } else {
      view.setZoom(zoom);
    }
  }

  public getBBox(): BoundingBoxTuple {
    if (!this.map) return [0, 0, 0, 0];
    try {
      const size = this.map.getSize() || [800, 600];
      const extent = this.map.getView().calculateExtent(size);
      if (
        !extent ||
        !Array.isArray(extent) ||
        extent.length < 4 ||
        !isFinite(extent[0])
      ) {
        return [0, 0, 0, 0];
      }
      const min = toLonLat([extent[0], extent[1]]);
      const max = toLonLat([extent[2], extent[3]]);
      return [min[0], min[1], max[0], max[1]];
    } catch (e) {
      return [0, 0, 0, 0];
    }
  }

  public getProjection(): SpatialReference {
    return "EPSG:4326";
  }

  public fitExtent(bbox: BoundingBoxTuple | any, padding: number = 40): void {
    if (!this.map) return;
    let minLng: number, minLat: number, maxLng: number, maxLat: number;

    if (Array.isArray(bbox)) {
      [minLng, minLat, maxLng, maxLat] = bbox;
    } else {
      minLng = bbox.minLongitude;
      minLat = bbox.minLatitude;
      maxLng = bbox.maxLongitude;
      maxLat = bbox.maxLatitude;
    }

    const min = fromLonLat([minLng, minLat]);
    const max = fromLonLat([maxLng, maxLat]);
    const extent = [min[0], min[1], max[0], max[1]];

    this.map.getView().fit(extent, {
      padding: [padding, padding, padding, padding],
      duration: 600,
    });
  }

  // --- Layer Adapter Implementation ---

  public addLayer(layer: BaseGISLayer): void {
    if (!this.map) return;

    if (layer.type === "tile") {
      const tileSdk = layer as SDKTileLayer;
      const olTileLayer = new TileLayer({
        source: this.createTileSource(tileSdk.provider),
        visible: tileSdk.visible,
        opacity: tileSdk.opacity,
        zIndex: tileSdk.zIndex,
      });
      this.map.addLayer(olTileLayer);
      this.layersMap.set(layer.id, { layer: olTileLayer, source: null });
    } else if (layer.type === "vector") {
      const vectorSdk = layer as SDKVectorLayer;
      const source = new VectorSource();
      const olVectorLayer = new VectorLayer({
        source,
        visible: vectorSdk.visible,
        opacity: vectorSdk.opacity,
        zIndex: vectorSdk.zIndex,
        style: (feat) =>
          this.convertStyleToOl(
            feat.get("sdkFeature")?.style || vectorSdk.defaultStyle,
          ),
      });
      this.map.addLayer(olVectorLayer);
      this.layersMap.set(layer.id, { layer: olVectorLayer, source });
    } else if (layer.type === "cluster") {
      const clusterSdk = layer as SDKClusterLayer;
      const vectorSource = new VectorSource();
      const clusterSource = new ClusterSource({
        distance: clusterSdk.clusterOptions.distance ?? 40,
        minDistance: clusterSdk.clusterOptions.minClusterSize ?? 2,
        source: vectorSource,
      });
      const olClusterLayer = new VectorLayer({
        source: clusterSource,
        visible: clusterSdk.visible,
        opacity: clusterSdk.opacity,
        zIndex: clusterSdk.zIndex,
        style: (feat) => this.styleClusterFeature(feat as Feature, clusterSdk),
      });
      this.map.addLayer(olClusterLayer);
      this.layersMap.set(layer.id, {
        layer: olClusterLayer,
        source: vectorSource,
      });
    } else if (layer.type === "heatmap") {
      const heatmapSdk = layer as SDKHeatmapLayer;
      const source = new VectorSource();
      const olHeatmapLayer = new HeatmapLayer({
        source,
        visible: heatmapSdk.visible,
        opacity: heatmapSdk.opacity,
        zIndex: heatmapSdk.zIndex,
        radius: heatmapSdk.heatmapOptions.radius ?? 15,
        blur: heatmapSdk.heatmapOptions.blur ?? 15,
        weight: (feat) => {
          const propName = heatmapSdk.heatmapOptions.weightProperty || "weight";
          const featData = feat.get("sdkFeature");
          return featData?.properties?.[propName] ?? 0.5;
        },
      });
      this.map.addLayer(olHeatmapLayer);
      this.layersMap.set(layer.id, { layer: olHeatmapLayer, source });
    }
  }

  public removeLayer(layerId: string): void {
    const entry = this.layersMap.get(layerId);
    if (entry && this.map) {
      this.map.removeLayer(entry.layer);
      this.layersMap.delete(layerId);
    }
  }

  public setLayerVisibility(layerId: string, visible: boolean): void {
    const entry = this.layersMap.get(layerId);
    if (entry) {
      entry.layer.setVisible(visible);
    }
  }

  public setLayerOpacity(layerId: string, opacity: number): void {
    const entry = this.layersMap.get(layerId);
    if (entry) {
      entry.layer.setOpacity(opacity);
    }
  }

  public setLayerZIndex(layerId: string, zIndex: number): void {
    const entry = this.layersMap.get(layerId);
    if (entry) {
      entry.layer.setZIndex(zIndex);
    }
  }

  public setBaseTile(provider: BaseTileProvider): void {
    if (this.defaultTileLayer) {
      this.defaultTileLayer.setSource(this.createTileSource(provider));
    }
  }

  // --- Feature Operations ---

  public renderFeatures(features: MapFeature[], layerId?: string): void {
    const source = this.getTargetSource(layerId);
    if (!source) return;

    const olFeatures = features.map((f) => this.convertMapFeatureToOl(f));
    source.addFeatures(olFeatures);

    features.forEach((f, idx) => {
      this.featuresMap.set(f.id, olFeatures[idx]);
    });
  }

  public clearFeatures(layerId?: string): void {
    const source = this.getTargetSource(layerId);
    if (source) {
      source.clear();
    }
  }

  public removeFeature(featureId: string, layerId?: string): void {
    const olFeature = this.featuresMap.get(featureId);
    const source = this.getTargetSource(layerId);
    if (olFeature && source) {
      source.removeFeature(olFeature);
      this.featuresMap.delete(featureId);
    }
  }

  // --- Selection Callbacks ---

  public onSelect(
    callback: (feature: MapFeature | null, coordinate: Coordinate) => void,
  ): void {
    this.selectCallback = callback;
  }

  public onHover(
    callback: (feature: MapFeature | null, coordinate: Coordinate) => void,
  ): void {
    this.hoverCallback = callback;
  }

  // --- Popup Adapter ---

  public open(coordinate: Coordinate, content: HTMLElement | string): void {
    if (!this.overlay || !this.map) return;
    const element = this.overlay.getElement();
    if (element) {
      if (typeof content === "string") {
        element.innerHTML = content;
      } else {
        element.innerHTML = "";
        element.appendChild(content);
      }
    }
    const coords = fromLonLat(coordinate as [number, number]);
    this.overlay.setPosition(coords);
  }

  public close(): void {
    if (this.overlay) {
      this.overlay.setPosition(undefined);
    }
  }

  public setPosition(coordinate: Coordinate | undefined): void {
    if (!this.overlay) return;
    if (!coordinate) {
      this.overlay.setPosition(undefined);
    } else {
      this.overlay.setPosition(fromLonLat(coordinate as [number, number]));
    }
  }

  // --- Controls Adapter ---

  public setControls(config: MapControlConfig): void {
    if (!this.map || typeof document === "undefined") return;
    // Remove existing controls
    const controls = this.map.getControls();
    controls.clear();

    if (config.zoom) this.map.addControl(new Zoom());
    if (config.fullscreen) this.map.addControl(new FullScreen());
    if (config.scale) this.map.addControl(new ScaleLine());
    if (config.attribution) this.map.addControl(new Attribution());
  }

  // --- Drawing Adapter ---

  public startDrawing(
    type: DrawType,
    onComplete: (geometry: CoreGeometry) => void,
    onCancel: () => void,
  ): void {
    if (!this.map || !this.defaultVectorSource) return;
    this.stopDrawing();

    let olGeometryType: "Point" | "LineString" | "Polygon" = "Point";
    if (type === "LineString") olGeometryType = "LineString";
    if (type === "Polygon") olGeometryType = "Polygon";

    this.activeDrawInteraction = new Draw({
      source: this.defaultVectorSource,
      type: olGeometryType,
    });

    this.activeDrawInteraction.on("drawend", (evt) => {
      const olGeom = evt.feature.getGeometry();
      if (olGeom) {
        const coreGeom = this.convertOlGeometryToCore(olGeom);
        onComplete(coreGeom);
      }
      setTimeout(() => this.stopDrawing(), 50);
    });

    if (typeof document !== "undefined") {
      this.map.addInteraction(this.activeDrawInteraction);
    }
  }

  public stopDrawing(): void {
    if (this.activeDrawInteraction && this.map) {
      if (typeof document !== "undefined") {
        this.map.removeInteraction(this.activeDrawInteraction);
      }
      this.activeDrawInteraction = null;
    }
  }

  // --- Editing Adapter ---

  public startEditing(
    featureId: string,
    onUpdate: (geometry: CoreGeometry) => void,
    onCancel: () => void,
  ): void {
    if (!this.map || !this.defaultVectorSource) return;
    this.stopEditing();

    const olFeature = this.featuresMap.get(featureId);
    if (!olFeature) {
      throw new StructuredMapError(
        "FEATURE_NOT_FOUND",
        `Feature '${featureId}' not found for editing`,
      );
    }

    const editSource = new VectorSource({ features: [olFeature] });
    this.activeModifyInteraction = new Modify({ source: editSource });

    this.activeModifyInteraction.on("modifyend", (evt) => {
      const modifiedGeom = olFeature.getGeometry();
      if (modifiedGeom) {
        const coreGeom = this.convertOlGeometryToCore(modifiedGeom);
        onUpdate(coreGeom);
      }
    });

    if (typeof document !== "undefined") {
      this.map.addInteraction(this.activeModifyInteraction);
    }
  }

  public stopEditing(): void {
    if (this.activeModifyInteraction && this.map) {
      this.map.removeInteraction(this.activeModifyInteraction);
      this.activeModifyInteraction = null;
    }
  }

  // --- Interaction Adapter ---

  public enableInteraction(type: MapInteractionType): void {
    // Enabled via map interaction handling
  }

  public disableInteraction(type: MapInteractionType): void {
    // Disabled via map interaction handling
  }

  // --- Private Helpers ---

  private getTargetSource(layerId?: string): VectorSource | null {
    if (!layerId) return this.defaultVectorSource;
    const entry = this.layersMap.get(layerId);
    return entry?.source as VectorSource | null;
  }

  private setupEventListeners(): void {
    if (!this.map) return;

    this.map.on("singleclick", (evt) => {
      if (!this.map) return;
      let foundSdkFeature: MapFeature | null = null;

      this.map.forEachFeatureAtPixel(evt.pixel, (feat) => {
        const features = feat.get("features") as Feature[];
        if (features && features.length === 1) {
          foundSdkFeature = features[0].get("sdkFeature") as MapFeature;
        } else if (!features) {
          foundSdkFeature = feat.get("sdkFeature") as MapFeature;
        }
      });

      const lonLat = toLonLat(evt.coordinate);
      const coord: Coordinate = [lonLat[0], lonLat[1]];

      if (this.selectCallback) {
        this.selectCallback(foundSdkFeature, coord);
      }
    });

    this.map.on("pointermove", (evt) => {
      if (evt.dragging || !this.map) return;
      let foundSdkFeature: MapFeature | null = null;

      this.map.forEachFeatureAtPixel(evt.pixel, (feat) => {
        const features = feat.get("features") as Feature[];
        if (features && features.length === 1) {
          foundSdkFeature = features[0].get("sdkFeature") as MapFeature;
        } else if (!features) {
          foundSdkFeature = feat.get("sdkFeature") as MapFeature;
        }
      });

      const lonLat = toLonLat(evt.coordinate);
      const coord: Coordinate = [lonLat[0], lonLat[1]];

      if (this.hoverCallback) {
        this.hoverCallback(foundSdkFeature, coord);
      }
    });
  }

  private createTileSource(provider: BaseTileProvider) {
    if (provider === "dark" || provider === "carto_dark") {
      return new XYZ({
        url: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attributions: "© OpenStreetMap, © CARTO",
      });
    }
    if (provider === "light" || provider === "carto_light") {
      return new XYZ({
        url: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attributions: "© OpenStreetMap, © CARTO",
      });
    }
    if (provider === "satellite") {
      return new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attributions: "Source: Esri, Maxar, Earthstar Geographics",
      });
    }
    if (provider === "terrain") {
      return new XYZ({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
        attributions: "Source: Esri, USGS",
      });
    }
    if (provider === "topographic") {
      return new XYZ({
        url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
        attributions: "USGS - The National Map",
      });
    }
    return new OSM();
  }

  private convertMapFeatureToOl(feature: MapFeature): Feature {
    const olGeom = this.convertCoreGeometryToOl(feature.geometry);
    const olFeature = new Feature({ geometry: olGeom });
    olFeature.setId(feature.id);
    olFeature.set("sdkFeature", feature);
    if (feature.style) {
      olFeature.setStyle(this.convertStyleToOl(feature.style));
    }
    return olFeature;
  }

  private convertCoreGeometryToOl(geom: CoreGeometry): Geometry {
    if (geom.type === "Point") {
      return new Point(fromLonLat(geom.coordinates as [number, number]));
    }
    if (geom.type === "LineString") {
      return new LineString(
        geom.coordinates.map((c) => fromLonLat(c as [number, number])),
      );
    }
    if (geom.type === "Polygon") {
      return new Polygon(
        geom.coordinates.map((ring) =>
          ring.map((c) => fromLonLat(c as [number, number])),
        ),
      );
    }
    if (geom.type === "MultiPoint") {
      return new MultiPoint(
        geom.coordinates.map((c) => fromLonLat(c as [number, number])),
      );
    }
    if (geom.type === "MultiLineString") {
      return new MultiLineString(
        geom.coordinates.map((ls) =>
          ls.map((c) => fromLonLat(c as [number, number])),
        ),
      );
    }
    if (geom.type === "MultiPolygon") {
      return new MultiPolygon(
        geom.coordinates.map((poly) =>
          poly.map((ring) =>
            ring.map((c) => fromLonLat(c as [number, number])),
          ),
        ),
      );
    }
    throw new StructuredMapError(
      "UNSUPPORTED_GEOMETRY",
      `Unsupported geometry type '${(geom as any).type}'`,
    );
  }

  private convertOlGeometryToCore(olGeom: Geometry): CoreGeometry {
    const type = olGeom.getType();
    if (type === "Point") {
      const p = olGeom as Point;
      const coords = toLonLat(p.getCoordinates());
      return { type: "Point", coordinates: [coords[0], coords[1]] };
    }
    if (type === "LineString") {
      const ls = olGeom as LineString;
      const coords = ls.getCoordinates().map((c) => {
        const l = toLonLat(c);
        return [l[0], l[1]] as Coordinate;
      });
      return { type: "LineString", coordinates: coords };
    }
    if (type === "Polygon") {
      const poly = olGeom as Polygon;
      const coords = poly.getCoordinates().map((ring) =>
        ring.map((c) => {
          const l = toLonLat(c);
          return [l[0], l[1]] as Coordinate;
        }),
      );
      return { type: "Polygon", coordinates: coords };
    }
    throw new StructuredMapError(
      "UNSUPPORTED_GEOMETRY",
      `Conversion for OL geometry type '${type}' not supported`,
    );
  }

  private convertStyleToOl(style?: FeatureStyle): Style {
    let fillColor = style?.fillColor || "#3b82f6";
    const fillOpacity = style?.fillOpacity ?? 0.25;

    if (fillColor.startsWith("#") && fillOpacity !== undefined) {
      const hex = fillColor.replace("#", "");
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        fillColor = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`;
      }
    }

    const strokeColor = style?.strokeColor || "#2563eb";
    const strokeWidth = style?.strokeWidth ?? 2;
    const strokeDash = style?.strokeDashArray && style.strokeDashArray.length > 0 ? style.strokeDashArray : undefined;

    if (style?.iconUrl) {
      return new Style({
        image: new Icon({
          src: style.iconUrl,
          scale: style.iconScale ?? 1,
          rotation: style.iconRotation ?? 0,
        }),
        text: style.label
          ? new Text({
              text: style.label,
              offsetY: style.labelOffsetY ?? -16,
              fill: new Fill({ color: style.labelColor || "#ffffff" }),
              stroke: new Stroke({ color: "#0f172a", width: 3 }),
              font: style.labelFont || "12px sans-serif",
            })
          : undefined,
      });
    }

    return new Style({
      image: new CircleStyle({
        radius: style?.circleRadius ?? 8,
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      }),
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth, lineDash: strokeDash }),
      text: style?.label
        ? new Text({
            text: style.label,
            offsetY: style.labelOffsetY ?? -14,
            fill: new Fill({ color: style.labelColor || "#ffffff" }),
            stroke: new Stroke({ color: "#0f172a", width: 3 }),
            font: style.labelFont || "12px sans-serif",
          })
        : undefined,
    });
  }

  private styleClusterFeature(
    feat: Feature,
    clusterSdk: SDKClusterLayer,
  ): Style {
    const features = feat.get("features") as Feature[];
    if (features && features.length > 1) {
      const size = features.length;
      return new Style({
        image: new CircleStyle({
          radius: Math.min(25, 14 + size),
          fill: new Fill({
            color: clusterSdk.clusterOptions.clusterColor || "#2563eb",
          }),
          stroke: new Stroke({ color: "#ffffff", width: 3 }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: clusterSdk.clusterOptions.textColor || "#ffffff",
          }),
          font: "bold 12px sans-serif",
        }),
      });
    }
    const singleFeature = features ? features[0] : feat;
    const sdkFeat = singleFeature.get("sdkFeature") as MapFeature;
    return this.convertStyleToOl(sdkFeat?.style);
  }
}
