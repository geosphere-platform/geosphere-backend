/**
 * GeoSphere Offline SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const OFFLINE_UI_COMPONENTS = {
    OFFLINE_STATUS_INDICATOR: {
        id: "offline.status-indicator",
        name: "Offline Connectivity & Download Status Badge",
        version: "1.0.0",
        moduleId: "offline",
        description: "Compact status badge displaying live network status (ONLINE/OFFLINE) and active download progress",
        inputs: [
            { name: "status", type: "GeoSphereOfflineStatus", required: true, description: "Current offline system status" }
        ],
        outputs: [],
        events: ["offline.connectivityChanged"],
        requiredPermissions: ["offline.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "OfflineStatusIndicator", framework: "react" },
            { platform: "android", componentSymbol: "OfflineStatusIndicator", framework: "compose" },
            { platform: "ios", componentSymbol: "OfflineStatusIndicator", framework: "swiftui" }
        ]
    },
    DOWNLOAD_PROGRESS: {
        id: "offline.download-progress-bar",
        name: "Package Download Progress Bar Card",
        version: "1.0.0",
        moduleId: "offline",
        description: "Live progress card displaying download speed, percentage, phase, and pause/resume/cancel controls",
        inputs: [
            { name: "progress", type: "GeoSphereOfflineDownloadProgress", required: true, description: "Active package download progress" }
        ],
        outputs: ["onPause", "onResume", "onCancel"],
        events: ["offline.downloadProgress"],
        requiredPermissions: ["offline.download"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "DownloadProgress", framework: "react" },
            { platform: "android", componentSymbol: "DownloadProgress", framework: "compose" },
            { platform: "ios", componentSymbol: "DownloadProgress", framework: "swiftui" }
        ]
    },
    STORAGE_USAGE: {
        id: "offline.storage-usage-gauge",
        name: "Offline Storage Usage Gauge",
        version: "1.0.0",
        moduleId: "offline",
        description: "Storage gauge rendering total offline storage used versus max storage quota",
        inputs: [
            { name: "usedBytes", type: "number", required: true, description: "Storage bytes used" },
            { name: "maxBytes", type: "number", required: true, description: "Max quota limit in bytes" }
        ],
        outputs: ["onClearCache"],
        events: [],
        requiredPermissions: ["offline.manage"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "StorageUsage", framework: "react" },
            { platform: "android", componentSymbol: "StorageUsage", framework: "compose" },
            { platform: "ios", componentSymbol: "StorageUsage", framework: "swiftui" }
        ]
    }
};
export const OFFLINE_READY_MADE_SCREENS = {
    OFFLINE_MAPS_SCREEN: {
        id: "offline.maps-screen",
        title: "Offline Maps & Region Manager Screen",
        version: "1.0.0",
        moduleId: "offline",
        description: "Main offline map management screen allowing region selection, map download, and package inspection",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["MAP_PACKAGES", "REGION_SELECTION", "MAP_DOWNLOAD"],
        requiredPermissions: ["offline.read"],
        containedComponents: ["offline.status-indicator", "offline.download-progress-bar", "offline.storage-usage-gauge"],
        adapters: [
            { platform: "web", componentSymbol: "OfflineMapsScreen", framework: "react" },
            { platform: "android", componentSymbol: "OfflineMapsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "OfflineMapsScreen", framework: "swiftui" }
        ]
    },
    PACKAGE_MANAGER_SCREEN: {
        id: "offline.package-manager-screen",
        title: "Offline Package Manager Screen",
        version: "1.0.0",
        moduleId: "offline",
        description: "Package listing and lifecycle management screen showing downloaded maps, GIS data, and storage usage",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["PACKAGE_MANAGEMENT"],
        requiredPermissions: ["offline.manage"],
        containedComponents: ["offline.storage-usage-gauge"],
        adapters: [
            { platform: "web", componentSymbol: "OfflinePackageManagerScreen", framework: "react" },
            { platform: "android", componentSymbol: "OfflinePackageManagerScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "OfflinePackageManagerScreen", framework: "swiftui" }
        ]
    },
    DOWNLOAD_REGION_SCREEN: {
        id: "offline.download-region-screen",
        title: "Map Region Selection & Download Estimator Screen",
        version: "1.0.0",
        moduleId: "offline",
        description: "Map region picker screen allowing bounding box selection, size estimation, and download initiation",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["REGION_SELECTION", "MAP_DOWNLOAD"],
        requiredPermissions: ["offline.download"],
        containedComponents: ["offline.download-progress-bar"],
        adapters: [
            { platform: "web", componentSymbol: "DownloadRegionScreen", framework: "react" },
            { platform: "android", componentSymbol: "DownloadRegionScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "DownloadRegionScreen", framework: "swiftui" }
        ]
    },
    STORAGE_MANAGEMENT_SCREEN: {
        id: "offline.storage-screen",
        title: "Storage & Cache Management Screen",
        version: "1.0.0",
        moduleId: "offline",
        description: "Storage quotas configuration and cache eviction management screen",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["LOCAL_STORAGE", "STORAGE_QUOTAS"],
        requiredPermissions: ["offline.manage"],
        containedComponents: ["offline.storage-usage-gauge"],
        adapters: [
            { platform: "web", componentSymbol: "StorageManagementScreen", framework: "react" },
            { platform: "android", componentSymbol: "StorageManagementScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "StorageManagementScreen", framework: "swiftui" }
        ]
    },
    SYNC_STATUS_SCREEN: {
        id: "offline.sync-screen",
        title: "Offline Sync Queue & Conflicts Screen",
        version: "1.0.0",
        moduleId: "offline",
        description: "Sync queue monitor screen showing pending offline edits, retry count, and conflict resolution options",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["SYNC_QUEUE"],
        requiredPermissions: ["offline.sync"],
        containedComponents: ["offline.status-indicator"],
        adapters: [
            { platform: "web", componentSymbol: "SyncStatusScreen", framework: "react" },
            { platform: "android", componentSymbol: "SyncStatusScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "SyncStatusScreen", framework: "swiftui" }
        ]
    },
    OFFLINE_SETTINGS_SCREEN: {
        id: "offline.settings-screen",
        title: "Offline SDK Settings Screen",
        version: "1.0.0",
        moduleId: "offline",
        description: "Offline settings screen for configuring auto-sync, conflict strategy, and max storage quotas",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["PACKAGE_MANAGEMENT"],
        requiredPermissions: ["offline.configure"],
        containedComponents: ["offline.status-indicator"],
        adapters: [
            { platform: "web", componentSymbol: "OfflineSettingsScreen", framework: "react" },
            { platform: "android", componentSymbol: "OfflineSettingsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "OfflineSettingsScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=offline-ui.contracts.js.map