/**
 * GeoSphere Location SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */

import { GeoSphereComponentDefinition, GeoSphereScreenDefinition } from "./ui.contracts.js";

export const LOCATION_UI_COMPONENTS: Record<string, GeoSphereComponentDefinition> = {
  LOCATION_STATUS: {
    id: "location.status-badge",
    name: "Location Status Badge",
    version: "1.0.0",
    moduleId: "location",
    description: "Visual indicator badge displaying current device location state, GPS service availability, and quality",
    inputs: [
      { name: "state", type: "GeoSphereLocationState", required: true, description: "Current location state" }
    ],
    outputs: ["onRefreshRequest"],
    events: ["location.serviceChanged", "location.permissionChanged"],
    requiredPermissions: ["location.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "LocationStatus", framework: "react" },
      { platform: "android", componentSymbol: "LocationStatus", framework: "compose" },
      { platform: "ios", componentSymbol: "LocationStatus", framework: "swiftui" }
    ]
  },
  CURRENT_LOCATION_INDICATOR: {
    id: "location.current-indicator",
    name: "Current Location Indicator",
    version: "1.0.0",
    moduleId: "location",
    description: "Live coordinate and accuracy readout card with timestamp and precision indicator",
    inputs: [
      { name: "location", type: "GeoSphereLocation", required: true, description: "Active location data" }
    ],
    outputs: ["onCenterMap"],
    events: ["location.updated"],
    requiredPermissions: ["location.read", "location.current"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "CurrentLocationIndicator", framework: "react" },
      { platform: "android", componentSymbol: "CurrentLocationIndicator", framework: "compose" },
      { platform: "ios", componentSymbol: "CurrentLocationIndicator", framework: "swiftui" }
    ]
  },
  LOCATION_ACCURACY_INDICATOR: {
    id: "location.accuracy-indicator",
    name: "Location Accuracy Indicator",
    version: "1.0.0",
    moduleId: "location",
    description: "Quality meter card classifying horizontal accuracy (VERY_HIGH, HIGH, MEDIUM, LOW)",
    inputs: [
      { name: "accuracyMeters", type: "number", required: true, description: "Accuracy radius in meters" }
    ],
    outputs: [],
    events: ["location.updated"],
    requiredPermissions: ["location.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "LocationAccuracyIndicator", framework: "react" },
      { platform: "android", componentSymbol: "LocationAccuracyIndicator", framework: "compose" },
      { platform: "ios", componentSymbol: "LocationAccuracyIndicator", framework: "swiftui" }
    ]
  }
};

export const LOCATION_READY_MADE_SCREENS: Record<string, GeoSphereScreenDefinition> = {
  LOCATION_STATUS_SCREEN: {
    id: "location.status-screen",
    title: "Location Status Screen",
    version: "1.0.0",
    moduleId: "location",
    description: "Embedded location status overview screen with GPS state, accuracy meter, and refresh controls",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["CURRENT_LOCATION"],
    requiredPermissions: ["location.read"],
    containedComponents: ["location.status-badge", "location.accuracy-indicator"],
    adapters: [
      { platform: "web", componentSymbol: "LocationStatusScreen", framework: "react" },
      { platform: "android", componentSymbol: "LocationStatusScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "LocationStatusScreen", framework: "swiftui" }
    ]
  },
  LOCATION_PERMISSION_SCREEN: {
    id: "location.permission-screen",
    title: "Location Permission Request Screen",
    version: "1.0.0",
    moduleId: "location",
    description: "Permission request prompt screen guiding users through granting device location access",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["CURRENT_LOCATION"],
    requiredPermissions: ["location.current"],
    containedComponents: ["location.status-badge"],
    adapters: [
      { platform: "web", componentSymbol: "LocationPermissionScreen", framework: "react" },
      { platform: "android", componentSymbol: "LocationPermissionScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "LocationPermissionScreen", framework: "swiftui" }
    ]
  },
  LOCATION_SETTINGS_SCREEN: {
    id: "location.settings-screen",
    title: "Location Settings Screen",
    version: "1.0.0",
    moduleId: "location",
    description: "Location configuration screen for desired accuracy, stale location policy, and update interval",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["CURRENT_LOCATION"],
    requiredPermissions: ["location.configure"],
    containedComponents: ["location.status-badge", "location.accuracy-indicator"],
    adapters: [
      { platform: "web", componentSymbol: "LocationSettingsScreen", framework: "react" },
      { platform: "android", componentSymbol: "LocationSettingsScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "LocationSettingsScreen", framework: "swiftui" }
    ]
  },
  CURRENT_LOCATION_SCREEN: {
    id: "location.current-location-screen",
    title: "Current Location Screen",
    version: "1.0.0",
    moduleId: "location",
    description: "Dedicated single-location view screen with coordinates, altitude, speed, and accuracy quality meter",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["CURRENT_LOCATION", "HIGH_ACCURACY"],
    requiredPermissions: ["location.read", "location.current"],
    containedComponents: ["location.current-indicator", "location.accuracy-indicator"],
    adapters: [
      { platform: "web", componentSymbol: "CurrentLocationScreen", framework: "react" },
      { platform: "android", componentSymbol: "CurrentLocationScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "CurrentLocationScreen", framework: "swiftui" }
    ]
  }
};
