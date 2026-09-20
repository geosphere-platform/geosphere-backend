/**
 * GIS Core — OpenLayers Map Adapter Implementation
 *
 * Implements IGISMapAdapter interface using the new business-agnostic @gis/map SDK.
 * Decouples GIS Core applications from OpenLayers internal APIs.
 */

import { GISMap } from "@gis/map";
import {
  IGISMapAdapter,
  MapViewConfig,
  BaseMapTileProvider,
  MapFeatureData,
} from "../types/map";
import { Coordinate } from "../types/geometry";
import { BoundingBox } from "../bbox/bounding-box";
import { SpatialEntity } from "../types/entity";

export class OpenLayersMapAdapter implements IGISMapAdapter {
  private sdkMap: GISMap | null = null;
  private selectCallback: ((feature: MapFeatureData | null) => void) | null =
    null;

  initialize(containerElement: HTMLElement, config: MapViewConfig): void {
    this.sdkMap = new GISMap({
      center: config.center,
      zoom: config.zoom,
      minZoom: config.minZoom ?? 2,
      maxZoom: config.maxZoom ?? 19,
      baseTile: config.baseTile ?? "osm",
    });

    this.sdkMap.initialize(containerElement);

    this.sdkMap.on("featureSelected", ({ feature }) => {
      if (this.selectCallback) {
        if (!feature) {
          this.selectCallback(null);
        } else {
          this.selectCallback({
            id: feature.id,
            coordinate: (feature.geometry as any).coordinates || [0, 0],
            properties: feature.properties,
            entityType: feature.properties.entityType as string,
          });
        }
      }
    });
  }

  destroy(): void {
    if (this.sdkMap) {
      this.sdkMap.destroy();
      this.sdkMap = null;
    }
    this.selectCallback = null;
  }

  setCenter(center: Coordinate, animate: boolean = true): void {
    this.sdkMap?.setCenter(center, animate);
  }

  setZoom(zoom: number, animate: boolean = true): void {
    this.sdkMap?.setZoom(zoom, animate);
  }

  zoomToExtent(bbox: BoundingBox, padding: number = 50): void {
    this.sdkMap?.fitExtent(
      [
        bbox.minLongitude,
        bbox.minLatitude,
        bbox.maxLongitude,
        bbox.maxLatitude,
      ],
      padding,
    );
  }

  setTileLayer(tile: BaseMapTileProvider): void {
    this.sdkMap?.setBaseTile(tile);
  }

  renderEntities(entities: SpatialEntity[]): void {
    if (!this.sdkMap) return;
    this.sdkMap.features.clearFeatures();

    const mapFeatures = entities.map((entity) => ({
      id: entity.id,
      geometry: entity.geometry,
      properties: { ...entity.properties, entityType: entity.entityType },
      style: {
        circleRadius: 8,
        fillColor: "#3b82f6",
        strokeColor: "#ffffff",
        strokeWidth: 2,
      },
    }));

    this.sdkMap.features.addFeatures(mapFeatures);
  }

  clearEntities(): void {
    this.sdkMap?.features.clearFeatures();
  }

  onFeatureSelect(callback: (feature: MapFeatureData | null) => void): void {
    this.selectCallback = callback;
  }
}
