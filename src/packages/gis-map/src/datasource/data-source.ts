/**
 * GIS Map SDK — Map Data Source Abstraction
 *
 * Provides flexible spatial data loader capabilities for static, REST API, vector tile, or bounding-box spatial requests.
 */

import { MapDataSource, MapFeature, BoundingBoxTuple } from "../types";

export class StaticMapDataSource implements MapDataSource {
  public id: string;
  public name: string;
  private features: MapFeature[];

  constructor(id: string, name: string, features: MapFeature[] = []) {
    this.id = id;
    this.name = name;
    this.features = features;
  }

  public getFeatures(): MapFeature[] {
    return [...this.features];
  }

  public setFeatures(features: MapFeature[]): void {
    this.features = [...features];
  }
}

export class BoundingBoxMapDataSource implements MapDataSource {
  public id: string;
  public name: string;
  private fetcher: (
    bbox: BoundingBoxTuple,
    zoom: number,
  ) => Promise<MapFeature[]>;

  constructor(
    id: string,
    name: string,
    fetcher: (bbox: BoundingBoxTuple, zoom: number) => Promise<MapFeature[]>,
  ) {
    this.id = id;
    this.name = name;
    this.fetcher = fetcher;
  }

  public async loadFeaturesForViewport(
    bbox: BoundingBoxTuple,
    zoom: number,
  ): Promise<MapFeature[]> {
    return await this.fetcher(bbox, zoom);
  }
}
