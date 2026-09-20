/**
 * GeoSphere Mapping SDK Core Contracts & Multi-Platform Domain Models
 * Consumes GeoSphere GIS SDK Core Contracts (Zero Duplicate GIS Engines)
 * Framework-Neutral & Provider Independent (Zero Provider Leakage)
 */

import {
  GeoSphereGIS,
  GeoSphereGISConfig,
  GeoSphereViewport,
  GeoSphereLayer,
  GeoSphereFeature
} from "./gis.contracts.js";

export type GeoSphereMapProviderType =
  | "openlayers"
  | "maplibre"
  | "mapbox"
  | "google-maps"
  | "leaflet"
  | "custom";

export type GeoSphereMapCapability =
  | "TILE_MAP"
  | "VECTOR_TILES"
  | "SATELLITE"
  | "TERRAIN"
  | "ROTATION"
  | "PITCH"
  | "CLUSTERING"
  | "OFFLINE_MAPS"
  | "THREE_D"
  | "GEOCODING"
  | "STYLING";

export interface GeoSphereMapProvider {
  id: string;
  name: string;
  type: GeoSphereMapProviderType;
  capabilities: GeoSphereMapCapability[];
  attribution: string;
}

export type GeoSphereBasemapCategory =
  | "streets"
  | "satellite"
  | "hybrid"
  | "terrain"
  | "dark"
  | "light"
  | "custom";

export interface GeoSphereBasemap {
  id: string;
  name: string;
  category: GeoSphereBasemapCategory;
  providerType: GeoSphereMapProviderType;
  tileUrlPattern?: string;
  thumbnailUrl?: string;
  attribution: string;
  requiredCapability?: GeoSphereMapCapability;
}

export type GeoSphereMapStyleCategory = "light" | "dark" | "satellite" | "navigation" | "custom";

export interface GeoSphereMapStyle {
  id: string;
  name: string;
  category: GeoSphereMapStyleCategory;
  styleUrl?: string;
  tokens?: Record<string, string>;
}

export type ControlType =
  | "zoom"
  | "compass"
  | "scale"
  | "fullscreen"
  | "locate"
  | "layer"
  | "basemap"
  | "style"
  | "legend"
  | "search"
  | "settings";

export type ControlPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface GeoSphereMapControl {
  id: string;
  type: ControlType;
  position: ControlPosition;
  enabled: boolean;
}

export interface IMappingAdapterContract {
  initialize(containerId: string, viewport: GeoSphereViewport): Promise<void>;
  destroy(): void;
  setBasemap(basemap: GeoSphereBasemap): void;
  setMapStyle(style: GeoSphereMapStyle): void;
  toggleControl(controlId: string, enabled: boolean): void;
}

export interface GeoSphereMappingConfig {
  gisConfig: GeoSphereGISConfig;
  provider: GeoSphereMapProvider;
  defaultBasemap: GeoSphereBasemap;
  defaultStyle?: GeoSphereMapStyle;
  controls?: GeoSphereMapControl[];
  embeddedMode?: boolean;
}

export class GeoSphereMapping {
  private gis: GeoSphereGIS;
  private provider: GeoSphereMapProvider;
  private basemaps: Map<string, GeoSphereBasemap> = new Map();
  private activeBasemap: GeoSphereBasemap;
  private styles: Map<string, GeoSphereMapStyle> = new Map();
  private activeStyle?: GeoSphereMapStyle;
  private controls: Map<string, GeoSphereMapControl> = new Map();
  private adapter?: IMappingAdapterContract;

  constructor(private config: GeoSphereMappingConfig) {
    // Consumes GIS Engine from Step 8 (Zero Duplicate GIS Engine)
    this.gis = new GeoSphereGIS(config.gisConfig);
    this.provider = config.provider;
    this.activeBasemap = config.defaultBasemap;
    this.basemaps.set(config.defaultBasemap.id, config.defaultBasemap);

    if (config.defaultStyle) {
      this.activeStyle = config.defaultStyle;
      this.styles.set(config.defaultStyle.id, config.defaultStyle);
    }

    if (config.controls) {
      config.controls.forEach((c) => this.controls.set(c.id, c));
    }
  }

  public getGIS(): GeoSphereGIS {
    return this.gis;
  }

  public async initialize(adapter?: IMappingAdapterContract, containerId: string = "geosphere-map-container"): Promise<void> {
    if (adapter) {
      this.adapter = adapter;
      await this.adapter.initialize(containerId, this.gis.getViewport());
    }
    await this.gis.initialize(undefined, containerId);
  }

  public getProvider(): GeoSphereMapProvider {
    return this.provider;
  }

  public capabilities(): GeoSphereMapCapability[] {
    return this.provider.capabilities;
  }

  public hasCapability(capability: GeoSphereMapCapability): boolean {
    return this.provider.capabilities.includes(capability);
  }

  public getAttribution(): string {
    const basemapAttr = this.activeBasemap.attribution || "";
    const providerAttr = this.provider.attribution || "";
    return Array.from(new Set([providerAttr, basemapAttr].filter(Boolean))).join(" | ");
  }

  public addBasemap(basemap: GeoSphereBasemap): void {
    this.basemaps.set(basemap.id, basemap);
  }

  public getBasemaps(): GeoSphereBasemap[] {
    return Array.from(this.basemaps.values());
  }

  public setBasemap(basemapId: string): void {
    const basemap = this.basemaps.get(basemapId);
    if (basemap) {
      this.activeBasemap = basemap;
      if (this.adapter) {
        this.adapter.setBasemap(basemap);
      }
    }
  }

  public getActiveBasemap(): GeoSphereBasemap {
    return this.activeBasemap;
  }

  public addMapStyle(style: GeoSphereMapStyle): void {
    this.styles.set(style.id, style);
  }

  public getMapStyles(): GeoSphereMapStyle[] {
    return Array.from(this.styles.values());
  }

  public setMapStyle(styleId: string): void {
    const style = this.styles.get(styleId);
    if (style) {
      this.activeStyle = style;
      if (this.adapter) {
        this.adapter.setMapStyle(style);
      }
    }
  }

  public getActiveMapStyle(): GeoSphereMapStyle | undefined {
    return this.activeStyle;
  }

  public toggleControl(controlId: string, enabled: boolean): void {
    const control = this.controls.get(controlId);
    if (control) {
      control.enabled = enabled;
      if (this.adapter) {
        this.adapter.toggleControl(controlId, enabled);
      }
    }
  }

  public getControls(): GeoSphereMapControl[] {
    return Array.from(this.controls.values());
  }

  // Delegated Spatial Viewport & Feature Operations to GIS Engine
  public setViewport(viewport: Partial<GeoSphereViewport>): void {
    this.gis.setViewport(viewport);
  }

  public getViewport(): GeoSphereViewport {
    return this.gis.getViewport();
  }

  public addLayer(layer: GeoSphereLayer): void {
    this.gis.addLayer(layer);
  }

  public addFeature(feature: GeoSphereFeature): void {
    this.gis.addFeature(feature);
  }

  public destroy(): void {
    if (this.adapter) {
      this.adapter.destroy();
    }
    this.gis.destroy();
    this.basemaps.clear();
    this.styles.clear();
    this.controls.clear();
  }
}
