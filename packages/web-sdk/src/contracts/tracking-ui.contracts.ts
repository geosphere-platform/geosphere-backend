/**
 * GeoSphere Tracking SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */

import { GeoSphereComponentDefinition, GeoSphereScreenDefinition } from "./ui.contracts.js";

export const TRACKING_UI_COMPONENTS: Record<string, GeoSphereComponentDefinition> = {
  TRACKING_STATUS: {
    id: "tracking.status-badge",
    name: "Tracking Status Badge",
    version: "1.0.0",
    moduleId: "tracking",
    description: "Visual indicator badge displaying current tracking session state (RUNNING, PAUSED, IDLE, STOPPED)",
    inputs: [
      { name: "state", type: "GeoSphereTrackingState", required: true, description: "Active tracking session state" }
    ],
    outputs: [],
    events: ["tracking.started", "tracking.paused", "tracking.resumed", "tracking.stopped"],
    requiredPermissions: ["tracking.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "TrackingStatus", framework: "react" },
      { platform: "android", componentSymbol: "TrackingStatus", framework: "compose" },
      { platform: "ios", componentSymbol: "TrackingStatus", framework: "swiftui" }
    ]
  },
  TRACKING_CONTROLS: {
    id: "tracking.controls-toolbar",
    name: "Tracking Controls Toolbar",
    version: "1.0.0",
    moduleId: "tracking",
    description: "Interactive button panel for start, pause, resume, and stop tracking session lifecycle actions",
    inputs: [
      { name: "state", type: "GeoSphereTrackingState", required: true, description: "Active session state" }
    ],
    outputs: ["onStart", "onPause", "onResume", "onStop"],
    events: ["tracking.started", "tracking.paused", "tracking.resumed", "tracking.stopped"],
    requiredPermissions: ["tracking.start", "tracking.pause", "tracking.stop"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "TrackingControls", framework: "react" },
      { platform: "android", componentSymbol: "TrackingControls", framework: "compose" },
      { platform: "ios", componentSymbol: "TrackingControls", framework: "swiftui" }
    ]
  },
  TRACKING_SESSION_SUMMARY: {
    id: "tracking.session-summary-card",
    name: "Tracking Session Summary Card",
    version: "1.0.0",
    moduleId: "tracking",
    description: "Live session statistics card displaying total distance, active duration, point count, and quality score",
    inputs: [
      { name: "statistics", type: "GeoSphereTrackingStatistics", required: true, description: "Session statistics" }
    ],
    outputs: [],
    events: ["tracking.statisticsUpdated"],
    requiredPermissions: ["tracking.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "TrackingSessionSummary", framework: "react" },
      { platform: "android", componentSymbol: "TrackingSessionSummary", framework: "compose" },
      { platform: "ios", componentSymbol: "TrackingSessionSummary", framework: "swiftui" }
    ]
  }
};

export const TRACKING_READY_MADE_SCREENS: Record<string, GeoSphereScreenDefinition> = {
  TRACKING_DASHBOARD_SCREEN: {
    id: "tracking.dashboard-screen",
    title: "Tracking Dashboard Screen",
    version: "1.0.0",
    moduleId: "tracking",
    description: "Embeddable tracking dashboard with session controls, status badge, live statistics, and quality meter",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["CONTINUOUS_LOCATION", "PAUSE_RESUME", "DISTANCE_CALCULATION"],
    requiredPermissions: ["tracking.read"],
    containedComponents: ["tracking.status-badge", "tracking.controls-toolbar", "tracking.session-summary-card"],
    adapters: [
      { platform: "web", componentSymbol: "TrackingDashboardScreen", framework: "react" },
      { platform: "android", componentSymbol: "TrackingDashboardScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "TrackingDashboardScreen", framework: "swiftui" }
    ]
  },
  TRACKING_SESSION_SCREEN: {
    id: "tracking.session-screen",
    title: "Active Tracking Session Screen",
    version: "1.0.0",
    moduleId: "tracking",
    description: "Live session tracking screen displaying elapsed active time, total distance traveled, and latest speed",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["CONTINUOUS_LOCATION", "DISTANCE_CALCULATION"],
    requiredPermissions: ["tracking.start", "tracking.read"],
    containedComponents: ["tracking.status-badge", "tracking.session-summary-card"],
    adapters: [
      { platform: "web", componentSymbol: "TrackingSessionScreen", framework: "react" },
      { platform: "android", componentSymbol: "TrackingSessionScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "TrackingSessionScreen", framework: "swiftui" }
    ]
  },
  TRACKING_CONTROLS_SCREEN: {
    id: "tracking.controls-screen",
    title: "Tracking Controls Screen",
    version: "1.0.0",
    moduleId: "tracking",
    description: "Dedicated control panel screen with lifecycle action triggers (Start, Pause, Resume, Stop)",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["PAUSE_RESUME"],
    requiredPermissions: ["tracking.start", "tracking.pause", "tracking.stop"],
    containedComponents: ["tracking.controls-toolbar"],
    adapters: [
      { platform: "web", componentSymbol: "TrackingControlsScreen", framework: "react" },
      { platform: "android", componentSymbol: "TrackingControlsScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "TrackingControlsScreen", framework: "swiftui" }
    ]
  },
  TRACKING_SESSION_SUMMARY_SCREEN: {
    id: "tracking.summary-screen",
    title: "Tracking Session Summary Screen",
    version: "1.0.0",
    moduleId: "tracking",
    description: "Finalized tracking session summary screen displaying total distance, duration, point count, and quality",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["DISTANCE_CALCULATION"],
    requiredPermissions: ["tracking.read"],
    containedComponents: ["tracking.session-summary-card"],
    adapters: [
      { platform: "web", componentSymbol: "TrackingSessionSummaryScreen", framework: "react" },
      { platform: "android", componentSymbol: "TrackingSessionSummaryScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "TrackingSessionSummaryScreen", framework: "swiftui" }
    ]
  }
};
