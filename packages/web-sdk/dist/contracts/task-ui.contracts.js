/**
 * GeoSphere Task SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const TASK_UI_COMPONENTS = {
    TASK_CARD: {
        id: "tasks.task-card",
        name: "Task Summary Card Component",
        version: "1.0.0",
        moduleId: "tasks",
        description: "Compact card rendering title, status badge, priority, due date, and assigned user avatar",
        inputs: [
            { name: "task", type: "GeoSphereTaskInstance", required: true, description: "Task instance payload" }
        ],
        outputs: ["onSelect", "onStatusChange"],
        events: ["tasks.statusChanged"],
        requiredPermissions: ["tasks.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "TaskCard", framework: "react" },
            { platform: "android", componentSymbol: "TaskCard", framework: "compose" },
            { platform: "ios", componentSymbol: "TaskCard", framework: "swiftui" }
        ]
    },
    TASK_MAP: {
        id: "tasks.task-map",
        name: "Tasks Location Map Visualizer Component",
        version: "1.0.0",
        moduleId: "tasks",
        description: "Interactive map rendering task markers, status styling, and spatial clustering",
        inputs: [
            { name: "tasks", type: "GeoSphereTaskInstance[]", required: true, description: "Task instances list" }
        ],
        outputs: ["onTaskSelect"],
        events: ["tasks.created"],
        requiredPermissions: ["tasks.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "TaskMap", framework: "react" },
            { platform: "android", componentSymbol: "TaskMap", framework: "compose" },
            { platform: "ios", componentSymbol: "TaskMap", framework: "swiftui" }
        ]
    }
};
export const TASK_READY_MADE_SCREENS = {
    TASK_LIST_SCREEN: {
        id: "tasks.list-screen",
        title: "Task Management List Screen",
        version: "1.0.0",
        moduleId: "tasks",
        description: "Operational task list screen with status filtering, priority sorting, and quick actions",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["TASK_LIFECYCLE", "ASSIGNMENT_MANAGEMENT"],
        requiredPermissions: ["tasks.read"],
        containedComponents: ["tasks.task-card"],
        adapters: [
            { platform: "web", componentSymbol: "TaskListScreen", framework: "react" },
            { platform: "android", componentSymbol: "TaskListScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "TaskListScreen", framework: "swiftui" }
        ]
    },
    TASK_MAP_SCREEN: {
        id: "tasks.map-screen",
        title: "Task Spatial Map Screen",
        version: "1.0.0",
        moduleId: "tasks",
        description: "Full-screen spatial task map with interactive task pin selection and detail popovers",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["LOCATION_INTEGRATION", "MAP_VISUALIZATION"],
        requiredPermissions: ["tasks.read"],
        containedComponents: ["tasks.task-map"],
        adapters: [
            { platform: "web", componentSymbol: "TaskMapScreen", framework: "react" },
            { platform: "android", componentSymbol: "TaskMapScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "TaskMapScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=task-ui.contracts.js.map