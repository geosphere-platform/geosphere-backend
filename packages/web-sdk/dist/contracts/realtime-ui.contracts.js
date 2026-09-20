/**
 * GeoSphere Realtime SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const REALTIME_UI_COMPONENTS = {
    REALTIME_STATUS_INDICATOR: {
        id: "realtime.status-indicator",
        name: "Realtime Connection Status Badge",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Compact status badge rendering connection state (CONNECTED, CONNECTING, RECONNECTING, DISCONNECTED) and latency",
        inputs: [
            { name: "state", type: "GeoSphereRealtimeConnectionState", required: true, description: "Current connection state" },
            { name: "health", type: "GeoSphereRealtimeConnectionHealth", required: false, description: "Connection health telemetry" }
        ],
        outputs: [],
        events: ["realtime.connected", "realtime.disconnected"],
        requiredPermissions: ["realtime.connect"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "RealtimeStatusIndicator", framework: "react" },
            { platform: "android", componentSymbol: "RealtimeStatusIndicator", framework: "compose" },
            { platform: "ios", componentSymbol: "RealtimeStatusIndicator", framework: "swiftui" }
        ]
    },
    EVENT_STREAM_INDICATOR: {
        id: "realtime.event-stream-card",
        name: "Live Event Stream Activity Card",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Live event stream card rendering real-time events, topics, channels, and sequence numbers",
        inputs: [
            { name: "activeSubscriptions", type: "GeoSphereRealtimeSubscription[]", required: true, description: "Active subscriptions list" }
        ],
        outputs: ["onSelectEvent"],
        events: ["realtime.eventReceived"],
        requiredPermissions: ["realtime.subscribe"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "EventStreamIndicator", framework: "react" },
            { platform: "android", componentSymbol: "EventStreamIndicator", framework: "compose" },
            { platform: "ios", componentSymbol: "EventStreamIndicator", framework: "swiftui" }
        ]
    },
    CONNECTION_HEALTH: {
        id: "realtime.connection-health-panel",
        name: "Connection Health & Latency Monitor",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Health monitor panel detailing ping latency, heartbeat intervals, reconnect count, and duration",
        inputs: [
            { name: "health", type: "GeoSphereRealtimeConnectionHealth", required: true, description: "Realtime connection health struct" }
        ],
        outputs: ["onReconnect"],
        events: [],
        requiredPermissions: ["realtime.connect"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "ConnectionHealth", framework: "react" },
            { platform: "android", componentSymbol: "ConnectionHealth", framework: "compose" },
            { platform: "ios", componentSymbol: "ConnectionHealth", framework: "swiftui" }
        ]
    }
};
export const REALTIME_READY_MADE_SCREENS = {
    REALTIME_DASHBOARD_SCREEN: {
        id: "realtime.dashboard-screen",
        title: "Realtime Communication Dashboard Screen",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Comprehensive real-time streaming studio combining connection health, active subscriptions, and event stream monitor",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["WEBSOCKET", "PUB_SUB", "HEARTBEAT"],
        requiredPermissions: ["realtime.connect"],
        containedComponents: ["realtime.status-indicator", "realtime.event-stream-card", "realtime.connection-health-panel"],
        adapters: [
            { platform: "web", componentSymbol: "RealtimeDashboardScreen", framework: "react" },
            { platform: "android", componentSymbol: "RealtimeDashboardScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RealtimeDashboardScreen", framework: "swiftui" }
        ]
    },
    CONNECTION_STATUS_SCREEN: {
        id: "realtime.connection-screen",
        title: "Connection Status & Transport Monitor Screen",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Transport monitor screen providing WebSocket connection stats, latency, and heartbeat logs",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["WEBSOCKET", "HEARTBEAT"],
        requiredPermissions: ["realtime.connect"],
        containedComponents: ["realtime.status-indicator", "realtime.connection-health-panel"],
        adapters: [
            { platform: "web", componentSymbol: "ConnectionStatusScreen", framework: "react" },
            { platform: "android", componentSymbol: "ConnectionStatusScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "ConnectionStatusScreen", framework: "swiftui" }
        ]
    },
    EVENT_STREAM_SCREEN: {
        id: "realtime.event-stream-screen",
        title: "Realtime Event Stream Inspector Screen",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Live event stream inspector for viewing real-time envelopes, topics, channels, and correlation IDs",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["PUB_SUB", "EVENT_FILTERING"],
        requiredPermissions: ["realtime.subscribe"],
        containedComponents: ["realtime.event-stream-card"],
        adapters: [
            { platform: "web", componentSymbol: "EventStreamScreen", framework: "react" },
            { platform: "android", componentSymbol: "EventStreamScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "EventStreamScreen", framework: "swiftui" }
        ]
    },
    SUBSCRIPTION_MANAGEMENT_SCREEN: {
        id: "realtime.subscription-screen",
        title: "Subscription & Channel Manager Screen",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Subscription manager screen for creating, pausing, and unsubscribing from channel/topic streams",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["PUB_SUB"],
        requiredPermissions: ["realtime.subscribe"],
        containedComponents: ["realtime.event-stream-card"],
        adapters: [
            { platform: "web", componentSymbol: "SubscriptionManagementScreen", framework: "react" },
            { platform: "android", componentSymbol: "SubscriptionManagementScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "SubscriptionManagementScreen", framework: "swiftui" }
        ]
    },
    CHANNEL_TOPIC_SCREEN: {
        id: "realtime.channel-topic-screen",
        title: "Channel & Topic Registry Screen",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Channel and topic explorer screen detailing available channels, access controls, and subscriber counts",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["PUB_SUB"],
        requiredPermissions: ["realtime.subscribe"],
        containedComponents: ["realtime.event-stream-card"],
        adapters: [
            { platform: "web", componentSymbol: "ChannelTopicScreen", framework: "react" },
            { platform: "android", componentSymbol: "ChannelTopicScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "ChannelTopicScreen", framework: "swiftui" }
        ]
    },
    REALTIME_SETTINGS_SCREEN: {
        id: "realtime.settings-screen",
        title: "Realtime SDK Transport Settings Screen",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Transport configuration screen for auto-reconnect backoff, heartbeat intervals, and payload size limits",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["WEBSOCKET"],
        requiredPermissions: ["realtime.manage"],
        containedComponents: ["realtime.status-indicator"],
        adapters: [
            { platform: "web", componentSymbol: "RealtimeSettingsScreen", framework: "react" },
            { platform: "android", componentSymbol: "RealtimeSettingsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RealtimeSettingsScreen", framework: "swiftui" }
        ]
    },
    REALTIME_ERROR_RECOVERY_SCREEN: {
        id: "realtime.error-recovery-screen",
        title: "Realtime Connection Error & Recovery Screen",
        version: "1.0.0",
        moduleId: "realtime",
        description: "Error recovery screen for connection timeouts, reconnect exhaustion, or subscription authorization failures",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["RECONNECT_BACKOFF"],
        requiredPermissions: ["realtime.connect"],
        containedComponents: ["realtime.connection-health-panel"],
        adapters: [
            { platform: "web", componentSymbol: "RealtimeErrorRecoveryScreen", framework: "react" },
            { platform: "android", componentSymbol: "RealtimeErrorRecoveryScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "RealtimeErrorRecoveryScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=realtime-ui.contracts.js.map