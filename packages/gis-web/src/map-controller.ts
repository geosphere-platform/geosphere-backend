import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import OSM from "ol/source/OSM.js";
import VectorSource from "ol/source/Vector.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import LineString from "ol/geom/LineString.js";
import Polygon from "ol/geom/Polygon.js";
import { fromLonLat, toLonLat } from "ol/proj.js";

export interface MapControllerConfig {
  target: HTMLElement | string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
}

export class GeoSphereMapController {
  private map: Map;
  private vectorSource: VectorSource;
  private vectorLayer: VectorLayer<VectorSource>;

  constructor(config: MapControllerConfig) {
    const centerLonLat = config.center || [0, 0];
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource
    });

    this.map = new Map({
      target: config.target,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat(centerLonLat),
        zoom: config.zoom || 10
      })
    });
  }

  public addMarker(id: string, lng: number, lat: number, properties?: Record<string, unknown>): Feature {
    const feature = new Feature({
      geometry: new Point(fromLonLat([lng, lat])),
      id,
      ...properties
    });
    feature.setId(id);
    this.vectorSource.addFeature(feature);
    return feature;
  }

  public addPolyline(id: string, coordinates: [number, number][]): Feature {
    const projectedCoords = coordinates.map((c) => fromLonLat(c));
    const feature = new Feature({
      geometry: new LineString(projectedCoords),
      id
    });
    feature.setId(id);
    this.vectorSource.addFeature(feature);
    return feature;
  }

  public addPolygon(id: string, coordinates: [number, number][][]): Feature {
    const projectedRings = coordinates.map((ring) => ring.map((c) => fromLonLat(c)));
    const feature = new Feature({
      geometry: new Polygon(projectedRings),
      id
    });
    feature.setId(id);
    this.vectorSource.addFeature(feature);
    return feature;
  }

  public clearFeatures(): void {
    this.vectorSource.clear();
  }

  public getExtentBBOX(): [number, number, number, number] {
    const extent = this.map.getView().calculateExtent(this.map.getSize());
    const min = toLonLat([extent[0], extent[1]]);
    const max = toLonLat([extent[2], extent[3]]);
    return [min[0], min[1], max[0], max[1]];
  }

  public destroy(): void {
    this.map.setTarget(undefined);
  }
}
