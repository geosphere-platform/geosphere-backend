/**
 * GeoSphere Notifications SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const NOTIFICATIONS_UI_COMPONENTS = {
    NOTIFICATION_BELL: {
        id: "notifications.bell-button",
        name: "Notification Bell Button with Unread Badge",
        version: "1.0.0",
        moduleId: "notifications",
        description: "Header bell icon displaying live unread notification count badge",
        inputs: [
            { name: "unreadCount", type: "number", required: true, description: "Unread count" }
        ],
        outputs: ["onClick"],
        events: ["notifications.read", "notifications.allRead"],
        requiredPermissions: ["notifications.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "NotificationBell", framework: "react" },
            { platform: "android", componentSymbol: "NotificationBell", framework: "compose" },
            { platform: "ios", componentSymbol: "NotificationBell", framework: "swiftui" }
        ]
    },
    NOTIFICATION_CARD: {
        id: "notifications.notification-card",
        name: "Notification Item Card",
        version: "1.0.0",
        moduleId: "notifications",
        description: "Item card displaying notification severity, title, body, timestamp, and action buttons",
        inputs: [
            { name: "notification", type: "GeoSphereNotification", required: true, description: "Notification payload" }
        ],
        outputs: ["onMarkRead", "onAcknowledge", "onDismiss", "onAction"],
        events: ["notifications.read", "notifications.acknowledged", "notifications.dismissed"],
        requiredPermissions: ["notifications.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "NotificationCard", framework: "react" },
            { platform: "android", componentSymbol: "NotificationCard", framework: "compose" },
            { platform: "ios", componentSymbol: "NotificationCard", framework: "swiftui" }
        ]
    },
    QUIET_HOURS_SETTINGS: {
        id: "notifications.quiet-hours-panel",
        name: "Quiet Hours Schedule Settings Panel",
        version: "1.0.0",
        moduleId: "notifications",
        description: "Settings panel configuring quiet hours start/end times and timezone preferences",
        inputs: [
            { name: "preferences", type: "GeoSphereNotificationPreference", required: true, description: "Current preferences" }
        ],
        outputs: ["onSavePreferences"],
        events: ["notifications.preferencesUpdated"],
        requiredPermissions: ["notifications.configure"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "QuietHoursSettings", framework: "react" },
            { platform: "android", componentSymbol: "QuietHoursSettings", framework: "compose" },
            { platform: "ios", componentSymbol: "QuietHoursSettings", framework: "swiftui" }
        ]
    }
};
export const NOTIFICATIONS_READY_MADE_SCREENS = {
    NOTIFICATION_CENTER_SCREEN: {
        id: "notifications.center-screen",
        title: "Notification Center Studio Screen",
        version: "1.0.0",
        moduleId: "notifications",
        description: "Comprehensive Notification Center screen showing unread filter, category tabs, and action cards",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["IN_APP", "READ_RECEIPTS", "EXPLICIT_ACK"],
        requiredPermissions: ["notifications.read"],
        containedComponents: ["notifications.bell-button", "notifications.notification-card", "notifications.quiet-hours-panel"],
        adapters: [
            { platform: "web", componentSymbol: "NotificationCenterScreen", framework: "react" },
            { platform: "android", componentSymbol: "NotificationCenterScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "NotificationCenterScreen", framework: "swiftui" }
        ]
    },
    NOTIFICATION_DETAIL_SCREEN: {
        id: "notifications.detail-screen",
        title: "Notification Details Inspector Screen",
        version: "1.0.0",
        moduleId: "notifications",
        description: "Detailed notification inspector screen detailing envelope metadata, correlation IDs, and deep links",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["IN_APP", "ACTIONS", "DEEP_LINKS"],
        requiredPermissions: ["notifications.read"],
        containedComponents: ["notifications.notification-card"],
        adapters: [
            { platform: "web", componentSymbol: "NotificationDetailScreen", framework: "react" },
            { platform: "android", componentSymbol: "NotificationDetailScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "NotificationDetailScreen", framework: "swiftui" }
        ]
    },
    NOTIFICATION_SETTINGS_SCREEN: {
        id: "notifications.settings-screen",
        title: "Notification Settings Screen",
        version: "1.0.0",
        moduleId: "notifications",
        description: "Settings screen configuring quiet hours, sounds, vibrations, and category toggles",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["QUIET_HOURS"],
        requiredPermissions: ["notifications.manage"],
        containedComponents: ["notifications.quiet-hours-panel"],
        adapters: [
            { platform: "web", componentSymbol: "NotificationSettingsScreen", framework: "react" },
            { platform: "android", componentSymbol: "NotificationSettingsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "NotificationSettingsScreen", framework: "swiftui" }
        ]
    },
    PUSH_PERMISSION_SCREEN: {
        id: "notifications.push-permission-screen",
        title: "Push Notification Permission Screen",
        version: "1.0.0",
        moduleId: "notifications",
        description: "Native push permission prompt screen guiding token registration for FCM, APNs, and Web Push",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["PUSH", "TOKEN_REGISTRATION"],
        requiredPermissions: ["notifications.configure"],
        containedComponents: ["notifications.bell-button"],
        adapters: [
            { platform: "web", componentSymbol: "PushPermissionScreen", framework: "react" },
            { platform: "android", componentSymbol: "PushPermissionScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "PushPermissionScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=notifications-ui.contracts.js.map