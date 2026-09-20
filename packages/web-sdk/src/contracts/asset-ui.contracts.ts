/**
 * GeoSphere Asset SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */

import { GeoSphereComponentDefinition, GeoSphereScreenDefinition } from "./ui.contracts.js";

export const ASSET_UI_COMPONENTS: Record<string, GeoSphereComponentDefinition> = {
  ASSET_CARD: {
    id: "assets.asset-card",
    name: "Resource Asset Card Component",
    version: "1.0.0",
    moduleId: "assets",
    description: "Card component displaying asset name, type badge, status, identifiers, and location summary",
    inputs: [
      { name: "asset", type: "GeoSphereAssetInstance", required: true, description: "Asset instance struct" }
    ],
    outputs: ["onSelect", "onStatusChange"],
    events: ["assets.statusChanged"],
    requiredPermissions: ["assets.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "AssetCard", framework: "react" },
      { platform: "android", componentSymbol: "AssetCard", framework: "compose" },
      { platform: "ios", componentSymbol: "AssetCard", framework: "swiftui" }
    ]
  },
  ASSET_MAP: {
    id: "assets.asset-map",
    name: "Asset Spatial Map Component",
    version: "1.0.0",
    moduleId: "assets",
    description: "Map visualizer rendering spatial asset pins, clustering, availability badges, and selection popups",
    inputs: [
      { name: "assets", type: "GeoSphereAssetInstance[]", required: true, description: "Asset list" }
    ],
    outputs: ["onAssetSelect"],
    events: ["assets.created"],
    requiredPermissions: ["assets.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "AssetMap", framework: "react" },
      { platform: "android", componentSymbol: "AssetMap", framework: "compose" },
      { platform: "ios", componentSymbol: "AssetMap", framework: "swiftui" }
    ]
  }
};

export const ASSET_READY_MADE_SCREENS: Record<string, GeoSphereScreenDefinition> = {
  ASSET_LIST_SCREEN: {
    id: "assets.list-screen",
    title: "Asset Directory Screen",
    version: "1.0.0",
    moduleId: "assets",
    description: "Full-screen asset directory with category tabs, status filters, and search bar",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["ASSET_LIFECYCLE", "ASSIGNMENT_ALLOCATION"],
    requiredPermissions: ["assets.read"],
    containedComponents: ["assets.asset-card"],
    adapters: [
      { platform: "web", componentSymbol: "AssetListScreen", framework: "react" },
      { platform: "android", componentSymbol: "AssetListScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "AssetListScreen", framework: "swiftui" }
    ]
  },
  ASSET_MAP_SCREEN: {
    id: "assets.map-screen",
    title: "Asset Spatial Map Screen",
    version: "1.0.0",
    moduleId: "assets",
    description: "Full-screen spatial map displaying asset locations, availability status, and detail overlays",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["LOCATION_INTEGRATION", "MAP_VISUALIZATION"],
    requiredPermissions: ["assets.read"],
    containedComponents: ["assets.asset-map"],
    adapters: [
      { platform: "web", componentSymbol: "AssetMapScreen", framework: "react" },
      { platform: "android", componentSymbol: "AssetMapScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "AssetMapScreen", framework: "swiftui" }
    ]
  }
};
