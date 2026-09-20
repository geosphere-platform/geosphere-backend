/**
 * GeoSphere Maps SDK — Generic Search Framework
 */

import { Coordinate, BoundingBoxTuple, MapFeature } from "../types";

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  coordinate: Coordinate;
  bbox?: BoundingBoxTuple;
  source: "coordinate" | "feature" | "geocoder" | "custom";
  feature?: MapFeature;
}

export interface ISearchProvider {
  id: string;
  name: string;
  search(query: string): Promise<SearchResultItem[]>;
}

export class CoordinateSearchProvider implements ISearchProvider {
  public readonly id = "coordinate-search";
  public readonly name = "Coordinate Parser";

  public async search(query: string): Promise<SearchResultItem[]> {
    const trimmed = query.trim();
    // Match "21.1458, 79.0882" or "21.1458 79.0882"
    const match = trimmed.match(/^([-+]?\d+(?:\.\d+)?)[,\s]+([-+]?\d+(?:\.\d+)?)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [
          {
            id: `coord-${lat}-${lng}`,
            title: `Coordinate: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
            description: "Direct coordinate location",
            coordinate: [lng, lat],
            source: "coordinate",
          },
        ];
      }
    }
    return [];
  }
}

export class FeatureSearchProvider implements ISearchProvider {
  public readonly id = "feature-search";
  public readonly name = "Loaded Layer Features";
  private getFeaturesFn: () => MapFeature[];

  constructor(getFeaturesFn: () => MapFeature[]) {
    this.getFeaturesFn = getFeaturesFn;
  }

  public async search(query: string): Promise<SearchResultItem[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const features = this.getFeaturesFn();
    const results: SearchResultItem[] = [];

    for (const feat of features) {
      const props = feat.properties || {};
      const title = String(props.name || props.title || props.id || feat.id);
      const desc = String(props.address || props.description || props.category || "");

      if (title.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
        let coord: Coordinate = [0, 0];
        if (feat.geometry.type === "Point") {
          coord = feat.geometry.coordinates as Coordinate;
        }

        results.push({
          id: `feat-${feat.id}`,
          title,
          description: desc,
          coordinate: coord,
          source: "feature",
          feature: feat,
        });
      }
    }

    return results.slice(0, 10);
  }
}
