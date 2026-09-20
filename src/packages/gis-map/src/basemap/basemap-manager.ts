/**
 * GeoSphere Maps SDK — Basemap Manager Module
 *
 * Provides extensible, provider-neutral Basemap management.
 * Strictly isolating tile provider credentials and URLs from business logic.
 */

export type BasemapCategory =
  | "streets"
  | "dark"
  | "light"
  | "satellite"
  | "hybrid"
  | "terrain"
  | "topographic"
  | "custom";

export interface BasemapConfig {
  id: string;
  name: string;
  category: BasemapCategory;
  tileUrlPattern: string;
  attribution: string;
  maxZoom?: number;
  minZoom?: number;
  thumbnailUrl?: string;
}

export const DEFAULT_BASEMAPS: BasemapConfig[] = [
  {
    id: "standard",
    name: "STANDARD",
    category: "streets",
    tileUrlPattern: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
    minZoom: 0,
  },
  {
    id: "light",
    name: "LIGHT",
    category: "light",
    tileUrlPattern: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap, © CARTO",
    maxZoom: 19,
    minZoom: 0,
  },
  {
    id: "dark",
    name: "DARK",
    category: "dark",
    tileUrlPattern: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap, © CARTO",
    maxZoom: 19,
    minZoom: 0,
  },
  {
    id: "satellite",
    name: "SATELLITE",
    category: "satellite",
    tileUrlPattern: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Source: Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
    minZoom: 0,
  },
  {
    id: "terrain",
    name: "TERRAIN",
    category: "terrain",
    tileUrlPattern: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Source: Esri, USGS",
    maxZoom: 16,
    minZoom: 0,
  },
  {
    id: "topographic",
    name: "TOPOGRAPHIC",
    category: "topographic",
    tileUrlPattern: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
    attribution: "USGS - The National Map",
    maxZoom: 16,
    minZoom: 0,
  },
];

export class BasemapManager {
  private basemaps: Map<string, BasemapConfig> = new Map();
  private activeBasemap: BasemapConfig;
  private onBasemapChangeCallbacks: Array<(basemap: BasemapConfig) => void> = [];

  constructor(initialBasemapId: string = "osm-streets", customBasemaps?: BasemapConfig[]) {
    // Populate default basemaps
    DEFAULT_BASEMAPS.forEach((bm) => this.basemaps.set(bm.id, bm));

    // Register optional custom basemaps
    if (customBasemaps) {
      customBasemaps.forEach((bm) => this.basemaps.set(bm.id, bm));
    }

    const initial = this.basemaps.get(initialBasemapId) || DEFAULT_BASEMAPS[0];
    this.activeBasemap = initial;
  }

  public registerBasemap(basemap: BasemapConfig): void {
    this.basemaps.set(basemap.id, basemap);
  }

  public removeBasemap(basemapId: string): boolean {
    if (basemapId === this.activeBasemap.id) {
      return false; // Cannot remove currently active basemap
    }
    return this.basemaps.delete(basemapId);
  }

  public setBasemap(basemapId: string): BasemapConfig {
    const target = this.basemaps.get(basemapId);
    if (!target) {
      throw new Error(`Basemap with id '${basemapId}' is not registered`);
    }
    this.activeBasemap = target;
    this.onBasemapChangeCallbacks.forEach((cb) => cb(target));
    return target;
  }

  public getActiveBasemap(): BasemapConfig {
    return this.activeBasemap;
  }

  public listBasemaps(): BasemapConfig[] {
    return Array.from(this.basemaps.values());
  }

  public onBasemapChange(callback: (basemap: BasemapConfig) => void): () => void {
    this.onBasemapChangeCallbacks.push(callback);
    return () => {
      this.onBasemapChangeCallbacks = this.onBasemapChangeCallbacks.filter((cb) => cb !== callback);
    };
  }
}
