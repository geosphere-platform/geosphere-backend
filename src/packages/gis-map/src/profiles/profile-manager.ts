/**
 * GeoSphere Maps SDK — Configurable Business Profiles System
 *
 * Reusable, business-agnostic map profiles for diverse industry domains:
 * Field Force, Fleet, Logistics, Government, Agriculture, Construction, Asset Management.
 */

import { BaseTileProvider, MapControlConfig } from "../types";

export type BusinessProfileType =
  | "FIELD_FORCE"
  | "FLEET"
  | "LOGISTICS"
  | "GOVERNMENT"
  | "AGRICULTURE"
  | "CONSTRUCTION"
  | "ASSET_MANAGEMENT"
  | "CUSTOM";

export interface MapProfileConfig {
  id: BusinessProfileType;
  name: string;
  description: string;
  defaultBasemap: BaseTileProvider;
  defaultZoom: number;
  availableTools: Array<"MEASURE" | "DRAW" | "EDIT" | "SNAPPING" | "TEMPORAL" | "GEOSPHERE_GEOFENCE" | "OFFLINE">;
  enabledControls: MapControlConfig;
  defaultLayers: Array<{ id: string; name: string; type: "vector" | "cluster" | "heatmap" | "tile" }>;
  density: "compact" | "comfortable" | "spacious";
  allowJurisdictionFiltering: boolean;
  exportSupported: boolean;
}

export const BUSINESS_PROFILE_PRESETS: Record<BusinessProfileType, MapProfileConfig> = {
  FIELD_FORCE: {
    id: "FIELD_FORCE",
    name: "Field Force Operations Profile",
    description: "Configured for task dispatch, agent telemetry, geofence check-ins, and inspection forms.",
    defaultBasemap: "standard",
    defaultZoom: 13,
    availableTools: ["MEASURE", "GEOSPHERE_GEOFENCE", "OFFLINE"],
    enabledControls: { zoom: true, fullscreen: true, scale: true, attribution: true },
    defaultLayers: [
      { id: "agent_telemetry", name: "Live Field Agents", type: "vector" },
      { id: "work_orders", name: "Work Order Tasks", type: "cluster" },
      { id: "geofence_zones", name: "Check-In Geofences", type: "vector" },
    ],
    density: "comfortable",
    allowJurisdictionFiltering: true,
    exportSupported: true,
  },
  FLEET: {
    id: "FLEET",
    name: "Fleet & Asset Telemetry Profile",
    description: "Optimized for vehicle position streaming, speed alerts, telemetry tracking, and breadcrumb trails.",
    defaultBasemap: "dark",
    defaultZoom: 12,
    availableTools: ["TEMPORAL", "GEOSPHERE_GEOFENCE", "MEASURE"],
    enabledControls: { zoom: true, fullscreen: true, scale: true, attribution: true },
    defaultLayers: [
      { id: "fleet_vehicles", name: "Live Vehicles", type: "vector" },
      { id: "telemetry_heatmap", name: "Speed Violation Density", type: "heatmap" },
    ],
    density: "compact",
    allowJurisdictionFiltering: false,
    exportSupported: true,
  },
  LOGISTICS: {
    id: "LOGISTICS",
    name: "Logistics & Supply Chain Profile",
    description: "Designed for corridor routing, transit ETA calculation, depot management, and delivery tracking.",
    defaultBasemap: "light",
    defaultZoom: 11,
    availableTools: ["MEASURE", "TEMPORAL"],
    enabledControls: { zoom: true, fullscreen: true, scale: true, attribution: true },
    defaultLayers: [
      { id: "transit_routes", name: "Freight Corridors", type: "vector" },
      { id: "depot_hubs", name: "Distribution Hubs", type: "cluster" },
    ],
    density: "comfortable",
    allowJurisdictionFiltering: true,
    exportSupported: true,
  },
  GOVERNMENT: {
    id: "GOVERNMENT",
    name: "Government & Civic Governance Profile",
    description: "Tailored for municipal boundary management, electoral zones, civic infrastructure, and land records.",
    defaultBasemap: "topographic",
    defaultZoom: 10,
    availableTools: ["DRAW", "EDIT", "MEASURE", "SNAPPING"],
    enabledControls: { zoom: true, fullscreen: true, scale: true, attribution: true },
    defaultLayers: [
      { id: "civic_boundaries", name: "Administrative Boundaries", type: "vector" },
      { id: "tax_parcels", name: "Cadastral Land Parcels", type: "vector" },
    ],
    density: "spacious",
    allowJurisdictionFiltering: true,
    exportSupported: true,
  },
  AGRICULTURE: {
    id: "AGRICULTURE",
    name: "Precision Agriculture Profile",
    description: "Focused on crop field boundaries, NDVI satellite imagery overlays, soil sampling, and irrigation zones.",
    defaultBasemap: "satellite",
    defaultZoom: 15,
    availableTools: ["MEASURE", "DRAW", "EDIT"],
    enabledControls: { zoom: true, fullscreen: true, scale: true, attribution: true },
    defaultLayers: [
      { id: "farm_plots", name: "Crop Field Boundaries", type: "vector" },
      { id: "ndvi_overlay", name: "Vegetation Index Raster", type: "tile" },
    ],
    density: "comfortable",
    allowJurisdictionFiltering: false,
    exportSupported: true,
  },
  CONSTRUCTION: {
    id: "CONSTRUCTION",
    name: "Construction Site & BIM Profile",
    description: "Built for high-precision site survey drawings, equipment tracking, vertex snapping, and elevation contouring.",
    defaultBasemap: "terrain",
    defaultZoom: 17,
    availableTools: ["MEASURE", "DRAW", "EDIT", "SNAPPING"],
    enabledControls: { zoom: true, fullscreen: true, scale: true, attribution: true },
    defaultLayers: [
      { id: "site_drawings", name: "Cadastral Site Layout", type: "vector" },
      { id: "machinery_pins", name: "Heavy Machinery", type: "vector" },
    ],
    density: "compact",
    allowJurisdictionFiltering: false,
    exportSupported: true,
  },
  ASSET_MANAGEMENT: {
    id: "ASSET_MANAGEMENT",
    name: "Enterprise Asset Management Profile",
    description: "Tailored for utility pipe/cable networks, electric grid substations, maintenance logs, and asset lifecycle.",
    defaultBasemap: "light",
    defaultZoom: 14,
    availableTools: ["MEASURE", "DRAW", "EDIT", "SNAPPING", "OFFLINE"],
    enabledControls: { zoom: true, fullscreen: true, scale: true, attribution: true },
    defaultLayers: [
      { id: "utility_pipes", name: "Underground Infrastructure", type: "vector" },
      { id: "substations", name: "Electrical Substations", type: "cluster" },
    ],
    density: "comfortable",
    allowJurisdictionFiltering: true,
    exportSupported: true,
  },
  CUSTOM: {
    id: "CUSTOM",
    name: "Custom Application Profile",
    description: "Developer-configurable profile preset.",
    defaultBasemap: "standard",
    defaultZoom: 13,
    availableTools: ["MEASURE", "DRAW", "EDIT", "SNAPPING", "TEMPORAL", "GEOSPHERE_GEOFENCE", "OFFLINE"],
    enabledControls: { zoom: true, fullscreen: true, scale: true, attribution: true },
    defaultLayers: [],
    density: "comfortable",
    allowJurisdictionFiltering: true,
    exportSupported: true,
  },
};

export class MapProfileManager {
  private currentProfile: MapProfileConfig;

  constructor(initialProfile: BusinessProfileType = "FIELD_FORCE") {
    this.currentProfile = BUSINESS_PROFILE_PRESETS[initialProfile] || BUSINESS_PROFILE_PRESETS.FIELD_FORCE;
  }

  public setProfile(profileId: BusinessProfileType): MapProfileConfig {
    const target = BUSINESS_PROFILE_PRESETS[profileId];
    if (!target) {
      throw new Error(`Invalid Business Profile '${profileId}'`);
    }
    this.currentProfile = target;
    return this.currentProfile;
  }

  public getProfile(): MapProfileConfig {
    return this.currentProfile;
  }

  public isToolSupported(tool: "MEASURE" | "DRAW" | "EDIT" | "SNAPPING" | "TEMPORAL" | "GEOSPHERE_GEOFENCE" | "OFFLINE"): boolean {
    return this.currentProfile.availableTools.includes(tool);
  }
}
