import {
  IMapProvider,
  MapOptions,
  LayerConfig,
  MapEventType,
} from "./map-provider.interface";
import {
  Coordinates,
  BoundingBox,
  GeoJSONFeature,
  SDKError,
  SDKErrorCode,
} from "@gis-sdk/core";

export class OpenLayersAdapter implements IMapProvider {
  private map: any = null;
  private layers: Map<string, any> = new Map();
  private eventListeners: Map<string, Set<(...args: any[]) => void>> =
    new Map();

  public initialize(options: MapOptions): void {
    if (typeof window === "undefined") {
      return; // SSR Guard
    }

    try {
      const Map = require("ol/Map").default;
      const View = require("ol/View").default;
      const TileLayer = require("ol/layer/Tile").default;
      const OSM = require("ol/source/OSM").default;
      const { fromLonLat } = require("ol/proj");

      const targetElem =
        typeof options.target === "string"
          ? document.getElementById(options.target)
          : options.target;

      if (!targetElem) {
        throw new SDKError(
          SDKErrorCode.VALIDATION_ERROR,
          `Map target element '${options.target}' not found.`,
        );
      }

      const centerLonLat = options.center || [0, 0];
      const initialView = new View({
        center: fromLonLat(centerLonLat),
        zoom: options.zoom ?? 2,
        minZoom: options.minZoom ?? 0,
        maxZoom: options.maxZoom ?? 28,
        rotation: options.rotation ?? 0,
      });

      const osmLayer = new TileLayer({
        source: new OSM(),
      });

      this.map = new Map({
        target: targetElem,
        layers: [osmLayer],
        view: initialView,
      });

      this.layers.set("base-osm", osmLayer);
    } catch (err: any) {
      if (err instanceof SDKError) throw err;
      throw new SDKError(
        SDKErrorCode.GIS_OPERATION_ERROR,
        `Failed to initialize OpenLayers map: ${err.message}`,
      );
    }
  }

  public destroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
      this.map = null;
      this.layers.clear();
      this.eventListeners.clear();
    }
  }

  public setCenter(coordinates: Coordinates): void {
    if (!this.map) return;
    const { fromLonLat } = require("ol/proj");
    this.map
      .getView()
      .setCenter(fromLonLat([coordinates.longitude, coordinates.latitude]));
  }

  public getCenter(): Coordinates {
    if (!this.map) return { latitude: 0, longitude: 0 };
    const { toLonLat } = require("ol/proj");
    const center = this.map.getView().getCenter();
    const [lon, lat] = toLonLat(center);
    return { latitude: lat, longitude: lon };
  }

  public setZoom(zoom: number): void {
    if (this.map) {
      this.map.getView().setZoom(zoom);
    }
  }

  public getZoom(): number {
    return this.map ? this.map.getView().getZoom() : 0;
  }

  public fitBounds(bounds: BoundingBox): void {
    if (!this.map) return;
    const { fromLonLat } = require("ol/proj");
    const extent = [
      ...fromLonLat([bounds.minLongitude, bounds.minLatitude]),
      ...fromLonLat([bounds.maxLongitude, bounds.maxLatitude]),
    ];
    this.map.getView().fit(extent, { padding: [20, 20, 20, 20], maxZoom: 18 });
  }

  public getBounds(): BoundingBox {
    if (!this.map)
      return {
        minLongitude: 0,
        minLatitude: 0,
        maxLongitude: 0,
        maxLatitude: 0,
      };
    const { toLonLat } = require("ol/proj");
    const extent = this.map.getView().calculateExtent(this.map.getSize());
    const [minLon, minLat] = toLonLat([extent[0], extent[1]]);
    const [maxLon, maxLat] = toLonLat([extent[2], extent[3]]);
    return {
      minLongitude: minLon,
      minLatitude: minLat,
      maxLongitude: maxLon,
      maxLatitude: maxLat,
    };
  }

  public setRotation(rotation: number): void {
    if (this.map) {
      this.map.getView().setRotation(rotation);
    }
  }

  public getRotation(): number {
    return this.map ? this.map.getView().getRotation() : 0;
  }

  public addLayer(config: LayerConfig): void {
    if (!this.map) return;
    const VectorLayer = require("ol/layer/Vector").default;
    const VectorSource = require("ol/source/Vector").default;
    const GeoJSON = require("ol/format/GeoJSON").default;

    let olLayer: any;
    if (
      config.type === "vector" ||
      config.type === "geojson" ||
      config.type === "marker" ||
      config.type === "geometry"
    ) {
      const source = new VectorSource({
        features: config.data
          ? new GeoJSON().readFeatures(config.data, {
              featureProjection: "EPSG:3857",
            })
          : [],
      });
      olLayer = new VectorLayer({
        source,
        visible: config.visible ?? true,
        opacity: config.opacity ?? 1,
        zIndex: config.zIndex ?? 1,
      });
    } else if (config.type === "vector-tile") {
      const VectorTileLayer = require("ol/layer/VectorTile").default;
      const VectorTileSource = require("ol/source/VectorTile").default;
      const MVT = require("ol/format/MVT").default;

      const source = new VectorTileSource({
        format: new MVT(),
        url: config.url || `/api/v1/tiles/${config.id}/{z}/{x}/{y}`,
      });

      olLayer = new VectorTileLayer({
        source,
        visible: config.visible ?? true,
        opacity: config.opacity ?? 1,
        zIndex: config.zIndex ?? 1,
      });
    }

    if (olLayer) {
      olLayer.set("id", config.id);
      this.map.addLayer(olLayer);
      this.layers.set(config.id, olLayer);
    }
  }

  public removeLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer && this.map) {
      this.map.removeLayer(layer);
      this.layers.delete(layerId);
    }
  }

  public updateLayer(layerId: string, updates: Partial<LayerConfig>): void {
    const layer = this.layers.get(layerId);
    if (layer) {
      if (updates.visible !== undefined) layer.setVisible(updates.visible);
      if (updates.opacity !== undefined) layer.setOpacity(updates.opacity);
      if (updates.zIndex !== undefined) layer.setZIndex(updates.zIndex);
    }
  }

  public setLayerVisibility(layerId: string, visible: boolean): void {
    this.updateLayer(layerId, { visible });
  }

  public setLayerOpacity(layerId: string, opacity: number): void {
    this.updateLayer(layerId, { opacity });
  }

  public addFeature(layerId: string, feature: GeoJSONFeature): void {
    const layer = this.layers.get(layerId);
    if (layer && layer.getSource) {
      const GeoJSON = require("ol/format/GeoJSON").default;
      const olFeature = new GeoJSON().readFeature(feature, {
        featureProjection: "EPSG:3857",
      });
      layer.getSource().addFeature(olFeature);
    }
  }

  public removeFeature(layerId: string, featureId: string | number): void {
    const layer = this.layers.get(layerId);
    if (layer && layer.getSource) {
      const source = layer.getSource();
      const feature = source.getFeatureById(featureId);
      if (feature) {
        source.removeFeature(feature);
      }
    }
  }

  public clearFeatures(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (layer && layer.getSource) {
      layer.getSource().clear();
    }
  }

  public on(event: MapEventType, callback: (payload: any) => void): () => void {
    if (!this.map) return () => {};

    const handler = (evt: any) => {
      const { toLonLat } = require("ol/proj");
      const coordinate = evt.coordinate ? toLonLat(evt.coordinate) : undefined;
      callback({
        type: event,
        coordinate: coordinate
          ? { longitude: coordinate[0], latitude: coordinate[1] }
          : undefined,
        pixel: evt.pixel,
        originalEvent: evt,
      });
    };

    const olEventType =
      event === "pointermove"
        ? "pointermove"
        : event === "click"
          ? "singleclick"
          : event;
    this.map.on(olEventType, handler);

    return () => {
      if (this.map) {
        this.map.un(olEventType, handler);
      }
    };
  }

  public getNativeMap(): any {
    return this.map;
  }
}
