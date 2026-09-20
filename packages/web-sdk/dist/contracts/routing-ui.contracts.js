/**
 * GeoSphere Routing SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const ROUTING_UI_COMPONENTS = {
    ROUTE_SUMMARY: {
        id: "routing.summary-card",
        name: "Route Summary Card",
        version: "1.0.0",
        moduleId: "routing",
        description: "Card component displaying total distance, duration, profile badge, and waypoint count",
        inputs: [
            { name: "summary", type: "GeoSphereRouteSummary", required: true, description: "Calculated route summary" }
        ],
        outputs: ["onSelectRoute"],
        events: ["routing.routeSelected"],
        requiredPermissions: ["routing.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "RouteSummary", framework: "react" },
            { platform: "android", componentSymbol: "RouteSummary", framework: "compose" },
            { platform: "ios", componentSymbol: "RouteSummary", framework: "swiftui" }
        ]
    },
    ROUTE_PROFILE_SELECTOR: {
        id: "routing.profile-selector",
        name: "Route Profile Selector Toolbar",
        version: "1.0.0",
        moduleId: "routing",
        description: "Interactive toolbar for selecting routing profiles (driving, walking, cycling, truck, motorcycle)",
        inputs: [
            { name: "profile", type: "GeoSphereRouteProfile", required: true, description: "Active routing profile" }
        ],
        outputs: ["onProfileChange"],
        events: [],
        requiredPermissions: ["routing.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "RouteProfileSelector", framework: "react" },
            { platform: "android", componentSymbol: "RouteProfileSelector", framework: "compose" },
            { platform: "ios", componentSymbol: "RouteProfileSelector", framework: "swiftui" }
        ]
    },
    ROUTE_INSTRUCTIONS: {
        id: "routing.instructions-list",
        name: "Route Turn Instructions List",
        version: "1.0.0",
        moduleId: "routing",
        description: "Step-by-step turn instructions list with step distances, durations, and maneuver icons",
        inputs: [
            { name: "steps", type: "GeoSphereRouteStep[]", required: true, description: "Route step list" }
        ],
        outputs: ["onStepSelect"],
        events: [],
        requiredPermissions: ["routing.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "RouteInstructions", framework: "react" },
            { platform: "android", componentSymbol: "RouteInstructions", framework: "compose" },
            { platform: "ios", componentSymbol: "RouteInstructions", framework: "swiftui" }
        ]
    }
};
export const ROUTING_READY_MADE_SCREENS = {
    ROUTE_PLANNER_SCREEN: {
        id: "routing.planner-screen",
        title: "Route Planner Screen",
        version: "1.0.0",
        moduleId: "routing",
        description: "Embeddable route planner screen with origin/destination inputs, waypoints list, and profile selector",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["ROUTE_CALCULATION", "WAYPOINTS"],
        requiredPermissions: ["routing.calculate"],
        containedComponents: ["routing.profile-selector", "routing.summary-card"],
        adapters: [
            { platform: "web", componentSymbol: "RoutePlannerScreen", framework: "react" },
            { platform: "android", componentSymbol: "RoutePlannerScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RoutePlannerScreen", framework: "swiftui" }
        ]
    },
    ROUTE_RESULTS_SCREEN: {
        id: "routing.results-screen",
        title: "Route Results Screen",
        version: "1.0.0",
        moduleId: "routing",
        description: "Route calculation results screen displaying primary route, alternatives, distance, and duration",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["ROUTE_CALCULATION"],
        requiredPermissions: ["routing.read"],
        containedComponents: ["routing.summary-card", "routing.instructions-list"],
        adapters: [
            { platform: "web", componentSymbol: "RouteResultsScreen", framework: "react" },
            { platform: "android", componentSymbol: "RouteResultsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RouteResultsScreen", framework: "swiftui" }
        ]
    },
    ROUTE_DETAILS_SCREEN: {
        id: "routing.details-screen",
        title: "Route Details Screen",
        version: "1.0.0",
        moduleId: "routing",
        description: "Comprehensive route details view showing legs, steps, turn instructions, and waypoints",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["ROUTE_CALCULATION", "TURN_INSTRUCTIONS"],
        requiredPermissions: ["routing.read"],
        containedComponents: ["routing.summary-card", "routing.instructions-list"],
        adapters: [
            { platform: "web", componentSymbol: "RouteDetailsScreen", framework: "react" },
            { platform: "android", componentSymbol: "RouteDetailsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RouteDetailsScreen", framework: "swiftui" }
        ]
    },
    ROUTE_ALTERNATIVES_SCREEN: {
        id: "routing.alternatives-screen",
        title: "Route Alternatives Screen",
        version: "1.0.0",
        moduleId: "routing",
        description: "Alternative routes selection screen allowing users to compare and choose alternative routes",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["ALTERNATIVE_ROUTES"],
        requiredPermissions: ["routing.select"],
        containedComponents: ["routing.summary-card"],
        adapters: [
            { platform: "web", componentSymbol: "RouteAlternativesScreen", framework: "react" },
            { platform: "android", componentSymbol: "RouteAlternativesScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RouteAlternativesScreen", framework: "swiftui" }
        ]
    },
    ROUTE_SETTINGS_SCREEN: {
        id: "routing.settings-screen",
        title: "Route Settings Screen",
        version: "1.0.0",
        moduleId: "routing",
        description: "Routing configuration screen for setting default provider, preferred profile, units, and avoidances",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["ROUTE_CALCULATION"],
        requiredPermissions: ["routing.configure"],
        containedComponents: ["routing.profile-selector"],
        adapters: [
            { platform: "web", componentSymbol: "RouteSettingsScreen", framework: "react" },
            { platform: "android", componentSymbol: "RouteSettingsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RouteSettingsScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=routing-ui.contracts.js.map