/**
 * GeoSphere Analytics SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const ANALYTICS_UI_COMPONENTS = {
    HEALTH_INDICATOR: {
        id: "analytics.health-indicator",
        name: "SDK Operational Health Badge",
        version: "1.0.0",
        moduleId: "analytics",
        description: "Status badge rendering overall SDK health metrics, error rates, and operational telemetry",
        inputs: [
            { name: "healthStatus", type: "string", required: true, description: "SDK Health Status" }
        ],
        outputs: ["onClick"],
        events: ["analytics.eventTracked"],
        requiredPermissions: ["analytics.view"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "HealthIndicator", framework: "react" },
            { platform: "android", componentSymbol: "HealthIndicator", framework: "compose" },
            { platform: "ios", componentSymbol: "HealthIndicator", framework: "swiftui" }
        ]
    },
    PERFORMANCE_CARD: {
        id: "analytics.performance-card",
        name: "Performance Measurement Card",
        version: "1.0.0",
        moduleId: "analytics",
        description: "Card displaying API latency, route calculation duration, and tile render times",
        inputs: [
            { name: "metric", type: "GeoSphereAnalyticsMetric", required: true, description: "Metric struct" }
        ],
        outputs: ["onRefresh"],
        events: ["analytics.metricRecorded"],
        requiredPermissions: ["analytics.view"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "PerformanceCard", framework: "react" },
            { platform: "android", componentSymbol: "PerformanceCard", framework: "compose" },
            { platform: "ios", componentSymbol: "PerformanceCard", framework: "swiftui" }
        ]
    },
    PRIVACY_SETTINGS: {
        id: "analytics.privacy-settings-panel",
        name: "Telemetry Privacy & Consent Settings Panel",
        version: "1.0.0",
        moduleId: "analytics",
        description: "Panel allowing users to manage telemetry consent, sampling rates, and privacy controls",
        inputs: [
            { name: "privacyConfig", type: "GeoSphereAnalyticsPrivacyConfig", required: true, description: "Current privacy configuration" }
        ],
        outputs: ["onSaveConfig"],
        events: ["analytics.privacyUpdated", "analytics.consentUpdated"],
        requiredPermissions: ["analytics.manage"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "PrivacySettings", framework: "react" },
            { platform: "android", componentSymbol: "PrivacySettings", framework: "compose" },
            { platform: "ios", componentSymbol: "PrivacySettings", framework: "swiftui" }
        ]
    }
};
export const ANALYTICS_READY_MADE_SCREENS = {
    ANALYTICS_DASHBOARD_SCREEN: {
        id: "analytics.dashboard-screen",
        title: "SDK Operational Observability Studio Screen",
        version: "1.0.0",
        moduleId: "analytics",
        description: "Comprehensive operational dashboard rendering SDK health, API latencies, error rates, and storage stats",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["EVENT_TRACKING", "METRIC_RECORDING", "PERFORMANCE_MEASUREMENT"],
        requiredPermissions: ["analytics.view"],
        containedComponents: ["analytics.health-indicator", "analytics.performance-card", "analytics.privacy-settings-panel"],
        adapters: [
            { platform: "web", componentSymbol: "AnalyticsDashboardScreen", framework: "react" },
            { platform: "android", componentSymbol: "AnalyticsDashboardScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "AnalyticsDashboardScreen", framework: "swiftui" }
        ]
    },
    SDK_HEALTH_SCREEN: {
        id: "analytics.sdk-health-screen",
        title: "SDK Health & Diagnostics Screen",
        version: "1.0.0",
        moduleId: "analytics",
        description: "Detailed operational health screen monitoring SDK error rates and reconnect metrics",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["EVENT_TRACKING", "METRIC_RECORDING"],
        requiredPermissions: ["analytics.view"],
        containedComponents: ["analytics.health-indicator"],
        adapters: [
            { platform: "web", componentSymbol: "SDKHealthScreen", framework: "react" },
            { platform: "android", componentSymbol: "SDKHealthScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "SDKHealthScreen", framework: "swiftui" }
        ]
    },
    PERFORMANCE_SCREEN: {
        id: "analytics.performance-screen",
        title: "SDK Performance Measurement Screen",
        version: "1.0.0",
        moduleId: "analytics",
        description: "Performance latency inspector monitoring routing calc duration, map ops, and API latencies",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["PERFORMANCE_MEASUREMENT"],
        requiredPermissions: ["analytics.view"],
        containedComponents: ["analytics.performance-card"],
        adapters: [
            { platform: "web", componentSymbol: "PerformanceScreen", framework: "react" },
            { platform: "android", componentSymbol: "PerformanceScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "PerformanceScreen", framework: "swiftui" }
        ]
    },
    PRIVACY_CONSENT_SCREEN: {
        id: "analytics.privacy-consent-screen",
        title: "Telemetry Privacy & Consent Management Screen",
        version: "1.0.0",
        moduleId: "analytics",
        description: "User consent management screen configuring telemetry permissions and data minimization settings",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["CONSENT_ENFORCEMENT", "DATA_MINIMIZATION"],
        requiredPermissions: ["analytics.manage"],
        containedComponents: ["analytics.privacy-settings-panel"],
        adapters: [
            { platform: "web", componentSymbol: "PrivacyConsentScreen", framework: "react" },
            { platform: "android", componentSymbol: "PrivacyConsentScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "PrivacyConsentScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=analytics-ui.contracts.js.map