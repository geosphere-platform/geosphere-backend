/**
 * GeoSphere Geofencing SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const GEOFENCE_UI_COMPONENTS = {
    GEOFENCE_LIST: {
        id: "geofence.list-view",
        name: "Geofence List View",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Interactive list component displaying active and inactive registered geofence zones",
        inputs: [
            { name: "geofences", type: "GeoSphereGeofence[]", required: true, description: "List of geofences" }
        ],
        outputs: ["onGeofenceSelect", "onToggleEnable"],
        events: ["geofence.enabled", "geofence.disabled"],
        requiredPermissions: ["geofence.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "GeofenceList", framework: "react" },
            { platform: "android", componentSymbol: "GeofenceList", framework: "compose" },
            { platform: "ios", componentSymbol: "GeofenceList", framework: "swiftui" }
        ]
    },
    GEOFENCE_STATUS: {
        id: "geofence.status-card",
        name: "Geofence Status Badge Card",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Card component displaying current device relationship state to active geofences (INSIDE, OUTSIDE, DWELL)",
        inputs: [
            { name: "state", type: "GeoSphereGeofenceState", required: true, description: "Active geofence state" }
        ],
        outputs: [],
        events: ["geofence.enter", "geofence.exit", "geofence.dwell"],
        requiredPermissions: ["geofence.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "GeofenceStatus", framework: "react" },
            { platform: "android", componentSymbol: "GeofenceStatus", framework: "compose" },
            { platform: "ios", componentSymbol: "GeofenceStatus", framework: "swiftui" }
        ]
    },
    GEOFENCE_CARD: {
        id: "geofence.card-item",
        name: "Geofence Detail Card",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Individual geofence card showing geometry type (circle/polygon), radius, and state badge",
        inputs: [
            { name: "geofence", type: "GeoSphereGeofence", required: true, description: "Geofence data" }
        ],
        outputs: ["onEdit", "onDelete"],
        events: [],
        requiredPermissions: ["geofence.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "GeofenceCard", framework: "react" },
            { platform: "android", componentSymbol: "GeofenceCard", framework: "compose" },
            { platform: "ios", componentSymbol: "GeofenceCard", framework: "swiftui" }
        ]
    }
};
export const GEOFENCE_READY_MADE_SCREENS = {
    GEOFENCE_DASHBOARD_SCREEN: {
        id: "geofence.dashboard-screen",
        title: "Geofence Dashboard Screen",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Embeddable geofence management screen with list view, status badges, and event history log",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["CIRCLE", "POLYGON", "ENTER_EXIT"],
        requiredPermissions: ["geofence.read"],
        containedComponents: ["geofence.list-view", "geofence.status-card", "geofence.card-item"],
        adapters: [
            { platform: "web", componentSymbol: "GeofenceDashboardScreen", framework: "react" },
            { platform: "android", componentSymbol: "GeofenceDashboardScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "GeofenceDashboardScreen", framework: "swiftui" }
        ]
    },
    GEOFENCE_LIST_SCREEN: {
        id: "geofence.list-screen",
        title: "Geofence List Screen",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Dedicated geofence list screen with search, filter, and enable/disable toggles",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["CIRCLE", "POLYGON"],
        requiredPermissions: ["geofence.read"],
        containedComponents: ["geofence.list-view"],
        adapters: [
            { platform: "web", componentSymbol: "GeofenceListScreen", framework: "react" },
            { platform: "android", componentSymbol: "GeofenceListScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "GeofenceListScreen", framework: "swiftui" }
        ]
    },
    GEOFENCE_DETAILS_SCREEN: {
        id: "geofence.details-screen",
        title: "Geofence Details Screen",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Geofence detail view showing geometry specs, dwell config, and recent transition events",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["CIRCLE", "POLYGON"],
        requiredPermissions: ["geofence.read"],
        containedComponents: ["geofence.card-item"],
        adapters: [
            { platform: "web", componentSymbol: "GeofenceDetailsScreen", framework: "react" },
            { platform: "android", componentSymbol: "GeofenceDetailsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "GeofenceDetailsScreen", framework: "swiftui" }
        ]
    },
    CREATE_GEOFENCE_SCREEN: {
        id: "geofence.create-screen",
        title: "Create Geofence Screen",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Screen for defining new circle or polygon geofences with center/radius or vertex inputs",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["CIRCLE", "POLYGON"],
        requiredPermissions: ["geofence.create"],
        containedComponents: ["geofence.card-item"],
        adapters: [
            { platform: "web", componentSymbol: "CreateGeofenceScreen", framework: "react" },
            { platform: "android", componentSymbol: "CreateGeofenceScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "CreateGeofenceScreen", framework: "swiftui" }
        ]
    },
    EDIT_GEOFENCE_SCREEN: {
        id: "geofence.edit-screen",
        title: "Edit Geofence Screen",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Geofence edit route for updating zone boundaries, radius, dwell threshold, or metadata",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["CIRCLE", "POLYGON"],
        requiredPermissions: ["geofence.update"],
        containedComponents: ["geofence.card-item"],
        adapters: [
            { platform: "web", componentSymbol: "EditGeofenceScreen", framework: "react" },
            { platform: "android", componentSymbol: "EditGeofenceScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "EditGeofenceScreen", framework: "swiftui" }
        ]
    },
    GEOFENCE_EVENT_HISTORY_SCREEN: {
        id: "geofence.event-history-screen",
        title: "Geofence Event History Screen",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Event log screen displaying historical ENTER, EXIT, and DWELL spatial transition events",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["ENTER_EXIT", "DWELL"],
        requiredPermissions: ["geofence.events.read"],
        containedComponents: ["geofence.status-card"],
        adapters: [
            { platform: "web", componentSymbol: "GeofenceEventHistoryScreen", framework: "react" },
            { platform: "android", componentSymbol: "GeofenceEventHistoryScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "GeofenceEventHistoryScreen", framework: "swiftui" }
        ]
    },
    GEOFENCE_SETTINGS_SCREEN: {
        id: "geofence.settings-screen",
        title: "Geofence Settings Screen",
        version: "1.0.0",
        moduleId: "geofence",
        description: "Geofencing configuration screen for setting accuracy thresholds, dwell timers, and debounce limits",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["CIRCLE", "POLYGON"],
        requiredPermissions: ["geofence.configure"],
        containedComponents: ["geofence.status-card"],
        adapters: [
            { platform: "web", componentSymbol: "GeofenceSettingsScreen", framework: "react" },
            { platform: "android", componentSymbol: "GeofenceSettingsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "GeofenceSettingsScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=geofence-ui.contracts.js.map