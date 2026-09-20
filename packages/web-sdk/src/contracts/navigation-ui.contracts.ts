/**
 * GeoSphere Navigation SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */

import { GeoSphereComponentDefinition, GeoSphereScreenDefinition } from "./ui.contracts.js";

export const NAVIGATION_UI_COMPONENTS: Record<string, GeoSphereComponentDefinition> = {
  CURRENT_MANEUVER: {
    id: "navigation.current-maneuver-card",
    name: "Current Maneuver Banner",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Prominent UI banner displaying current turn instruction, maneuver icon, and distance remaining to turn",
    inputs: [
      { name: "maneuver", type: "GeoSphereNavigationManeuver", required: true, description: "Active turn maneuver" }
    ],
    outputs: [],
    events: ["navigation.maneuverUpdated"],
    requiredPermissions: ["navigation.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "CurrentManeuver", framework: "react" },
      { platform: "android", componentSymbol: "CurrentManeuver", framework: "compose" },
      { platform: "ios", componentSymbol: "CurrentManeuver", framework: "swiftui" }
    ]
  },
  NEXT_MANEUVER: {
    id: "navigation.next-maneuver-card",
    name: "Next Maneuver Indicator",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Subtle indicator card displaying the upcoming secondary maneuver following current step completion",
    inputs: [
      { name: "maneuver", type: "GeoSphereNavigationManeuver", required: true, description: "Upcoming turn maneuver" }
    ],
    outputs: [],
    events: ["navigation.maneuverUpdated"],
    requiredPermissions: ["navigation.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "NextManeuver", framework: "react" },
      { platform: "android", componentSymbol: "NextManeuver", framework: "compose" },
      { platform: "ios", componentSymbol: "NextManeuver", framework: "swiftui" }
    ]
  },
  NAVIGATION_PROGRESS: {
    id: "navigation.progress-bar",
    name: "Navigation Progress Bar Card",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Live progress card displaying total trip percentage complete, remaining distance, duration, and ETA",
    inputs: [
      { name: "progress", type: "GeoSphereNavigationProgress", required: true, description: "Navigation trip progress" }
    ],
    outputs: [],
    events: ["navigation.progressUpdated"],
    requiredPermissions: ["navigation.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "NavigationProgress", framework: "react" },
      { platform: "android", componentSymbol: "NavigationProgress", framework: "compose" },
      { platform: "ios", componentSymbol: "NavigationProgress", framework: "swiftui" }
    ]
  },
  NAVIGATION_CONTROLS: {
    id: "navigation.controls-toolbar",
    name: "Navigation Controls Toolbar",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Action toolbar containing Pause, Resume, Stop, and Map Follow Mode toggle buttons",
    inputs: [
      { name: "state", type: "GeoSphereNavigationState", required: true, description: "Active session state" }
    ],
    outputs: ["onPause", "onResume", "onStop", "onToggleFollowMode"],
    events: ["navigation.paused", "navigation.resumed", "navigation.cancelled"],
    requiredPermissions: ["navigation.pause", "navigation.resume", "navigation.stop"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "NavigationControls", framework: "react" },
      { platform: "android", componentSymbol: "NavigationControls", framework: "compose" },
      { platform: "ios", componentSymbol: "NavigationControls", framework: "swiftui" }
    ]
  }
};

export const NAVIGATION_READY_MADE_SCREENS: Record<string, GeoSphereScreenDefinition> = {
  NAVIGATION_SCREEN: {
    id: "navigation.main-screen",
    title: "Live Active Navigation Screen",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Embeddable active navigation interface combining map rendering, current maneuver, progress, ETA, and controls",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["NAVIGATION_SESSION", "ROUTE_FOLLOWING", "MANEUVER_DETECTION", "PROGRESS_TRACKING"],
    requiredPermissions: ["navigation.start"],
    containedComponents: ["navigation.current-maneuver-card", "navigation.next-maneuver-card", "navigation.progress-bar", "navigation.controls-toolbar"],
    adapters: [
      { platform: "web", componentSymbol: "NavigationScreen", framework: "react" },
      { platform: "android", componentSymbol: "NavigationScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "NavigationScreen", framework: "swiftui" }
    ]
  },
  NAVIGATION_PREVIEW_SCREEN: {
    id: "navigation.preview-screen",
    title: "Navigation Route Preview Screen",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Route preview screen for inspecting calculated route legs and turn steps before launching active navigation",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["ROUTE_FOLLOWING"],
    requiredPermissions: ["navigation.read"],
    containedComponents: ["navigation.progress-bar"],
    adapters: [
      { platform: "web", componentSymbol: "NavigationPreviewScreen", framework: "react" },
      { platform: "android", componentSymbol: "NavigationPreviewScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "NavigationPreviewScreen", framework: "swiftui" }
    ]
  },
  NAVIGATION_SUMMARY_SCREEN: {
    id: "navigation.summary-screen",
    title: "Navigation Trip Summary Screen",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Finalized trip summary screen displayed upon destination arrival showing total time, distance, and stats",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["ARRIVED_DETECTION"],
    requiredPermissions: ["navigation.read"],
    containedComponents: ["navigation.progress-bar"],
    adapters: [
      { platform: "web", componentSymbol: "NavigationRouteSummaryScreen", framework: "react" },
      { platform: "android", componentSymbol: "NavigationRouteSummaryScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "NavigationRouteSummaryScreen", framework: "swiftui" }
    ]
  },
  NAVIGATION_SETTINGS_SCREEN: {
    id: "navigation.settings-screen",
    title: "Navigation Settings Screen",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Navigation configuration screen for setting auto-reroute, off-route thresholds, and map follow mode",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["NAVIGATION_SESSION"],
    requiredPermissions: ["navigation.configure"],
    containedComponents: ["navigation.controls-toolbar"],
    adapters: [
      { platform: "web", componentSymbol: "NavigationSettingsScreen", framework: "react" },
      { platform: "android", componentSymbol: "NavigationSettingsScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "NavigationSettingsScreen", framework: "swiftui" }
    ]
  },
  NAVIGATION_ERROR_SCREEN: {
    id: "navigation.error-screen",
    title: "Navigation Error & Reroute Recovery Screen",
    version: "1.0.0",
    moduleId: "navigation",
    description: "Error recovery screen displayed when off-route rerouting fails or location signal is lost",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["OFF_ROUTE_DETECTION"],
    requiredPermissions: ["navigation.read"],
    containedComponents: ["navigation.controls-toolbar"],
    adapters: [
      { platform: "web", componentSymbol: "NavigationErrorRecoveryScreen", framework: "react" },
      { platform: "android", componentSymbol: "NavigationErrorRecoveryScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "NavigationErrorRecoveryScreen", framework: "swiftui" }
    ]
  }
};
