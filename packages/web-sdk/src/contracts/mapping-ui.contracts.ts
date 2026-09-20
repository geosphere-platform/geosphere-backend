/**
 * GeoSphere Mapping SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */

import { GeoSphereComponentDefinition, GeoSphereScreenDefinition } from "./ui.contracts.js";

export const MAPPING_UI_COMPONENTS: Record<string, GeoSphereComponentDefinition> = {
  GEOSPHERE_MAP: {
    id: "mapping.map-canvas",
    name: "GeoSphere Map Canvas",
    version: "1.0.0",
    moduleId: "mapping",
    description: "Interactive map viewport component with tile rendering, control overlays, and attribution display",
    inputs: [
      { name: "config", type: "GeoSphereMappingConfig", required: true, description: "Mapping configuration" }
    ],
    outputs: ["onViewportChange", "onBasemapChange", "onMapClick"],
    events: ["map.click", "map.moveEnd", "layer.visibilityChanged"],
    requiredPermissions: ["map.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop", "large-desktop"],
    adapters: [
      { platform: "web", componentSymbol: "GeoSphereMap", framework: "react" },
      { platform: "android", componentSymbol: "GeoSphereMap", framework: "compose" },
      { platform: "ios", componentSymbol: "GeoSphereMap", framework: "swiftui" }
    ]
  },
  BASEMAP_SELECTOR: {
    id: "mapping.basemap-selector",
    name: "Basemap Selector Control",
    version: "1.0.0",
    moduleId: "mapping",
    description: "UI selector card for switching map tile basemaps (streets, satellite, terrain, dark, light)",
    inputs: [
      { name: "basemaps", type: "GeoSphereBasemap[]", required: true, description: "Available basemaps" }
    ],
    outputs: ["onBasemapSelect"],
    events: ["map.styleChanged"],
    requiredPermissions: ["basemap.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "BasemapSelector", framework: "react" },
      { platform: "android", componentSymbol: "BasemapSelector", framework: "compose" },
      { platform: "ios", componentSymbol: "BasemapSelector", framework: "swiftui" }
    ]
  },
  MAP_STYLE_SELECTOR: {
    id: "mapping.style-selector",
    name: "Map Style Selector",
    version: "1.0.0",
    moduleId: "mapping",
    description: "Selector panel for toggling visual map styles and theme overlays",
    inputs: [
      { name: "styles", type: "GeoSphereMapStyle[]", required: true, description: "Available map styles" }
    ],
    outputs: ["onStyleSelect"],
    events: ["map.styleChanged"],
    requiredPermissions: ["mapStyle.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "MapStyleSelector", framework: "react" },
      { platform: "android", componentSymbol: "MapStyleSelector", framework: "compose" },
      { platform: "ios", componentSymbol: "MapStyleSelector", framework: "swiftui" }
    ]
  }
};

export const MAPPING_READY_MADE_SCREENS: Record<string, GeoSphereScreenDefinition> = {
  MAP_VIEWER_SCREEN: {
    id: "mapping.viewer-screen",
    title: "Map Viewer Screen",
    version: "1.0.0",
    moduleId: "mapping",
    description: "End-to-end embeddable map screen with basemap selector, controls, and attribution bar",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["TILE_MAP", "STYLING"],
    requiredPermissions: ["map.read"],
    containedComponents: ["mapping.map-canvas", "mapping.basemap-selector", "gis.layer-switcher"],
    adapters: [
      { platform: "web", componentSymbol: "MapViewerScreen", framework: "react" },
      { platform: "android", componentSymbol: "MapViewerScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "MapViewerScreen", framework: "swiftui" }
    ]
  },
  BASEMAP_SELECTOR_SCREEN: {
    id: "mapping.basemap-selector-screen",
    title: "Basemap Selector Screen",
    version: "1.0.0",
    moduleId: "mapping",
    description: "Dedicated basemap selection panel screen with tile previews and attribution details",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["TILE_MAP"],
    requiredPermissions: ["basemap.read", "basemap.change"],
    containedComponents: ["mapping.basemap-selector"],
    adapters: [
      { platform: "web", componentSymbol: "BasemapSelectorScreen", framework: "react" },
      { platform: "android", componentSymbol: "BasemapSelectorScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "BasemapSelectorScreen", framework: "swiftui" }
    ]
  },
  MAP_STYLE_SELECTOR_SCREEN: {
    id: "mapping.style-selector-screen",
    title: "Map Style Selector Screen",
    version: "1.0.0",
    moduleId: "mapping",
    description: "Map style configuration screen for selecting light, dark, satellite, and custom visual themes",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["STYLING"],
    requiredPermissions: ["mapStyle.read", "mapStyle.change"],
    containedComponents: ["mapping.style-selector"],
    adapters: [
      { platform: "web", componentSymbol: "MapStyleSelectorScreen", framework: "react" },
      { platform: "android", componentSymbol: "MapStyleSelectorScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "MapStyleSelectorScreen", framework: "swiftui" }
    ]
  },
  LAYER_MANAGER_PANEL_SCREEN: {
    id: "mapping.layer-manager-screen",
    title: "Layer Manager Panel Screen",
    version: "1.0.0",
    moduleId: "mapping",
    description: "Layer ordering, opacity adjustment, and presentation manager panel",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["TILE_MAP"],
    requiredPermissions: ["layer.read", "layer.configure"],
    containedComponents: ["gis.layer-switcher"],
    adapters: [
      { platform: "web", componentSymbol: "LayerManagerPanelScreen", framework: "react" },
      { platform: "android", componentSymbol: "LayerManagerPanelScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "LayerManagerPanelScreen", framework: "swiftui" }
    ]
  },
  MAP_SETTINGS_SCREEN: {
    id: "mapping.settings-screen",
    title: "Map Settings Screen",
    version: "1.0.0",
    moduleId: "mapping",
    description: "Map settings screen for configuring controls, attribution visibility, and default viewports",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["TILE_MAP"],
    requiredPermissions: ["map.configure"],
    containedComponents: ["mapping.basemap-selector", "mapping.style-selector"],
    adapters: [
      { platform: "web", componentSymbol: "MapSettingsScreen", framework: "react" },
      { platform: "android", componentSymbol: "MapSettingsScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "MapSettingsScreen", framework: "swiftui" }
    ]
  }
};
