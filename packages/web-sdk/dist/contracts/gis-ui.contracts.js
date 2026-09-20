/**
 * GeoSphere GIS SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const GIS_UI_COMPONENTS = {
    GIS_MAP: {
        id: "gis.map",
        name: "GIS Map Canvas",
        version: "1.0.0",
        moduleId: "gis",
        description: "Interactive vector/raster map canvas supporting feature selection and layer overlays",
        inputs: [
            { name: "viewport", type: "GeoSphereViewport", required: true, description: "Initial map viewport" },
            { name: "layers", type: "GeoSphereLayer[]", required: false, description: "Active map layers" }
        ],
        outputs: ["onViewportChange", "onFeatureSelect", "onMapClick"],
        events: ["map.click", "feature.selected", "map.moveEnd"],
        requiredPermissions: ["gis.map.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop", "large-desktop"],
        adapters: [
            { platform: "web", componentSymbol: "GeoSphereGISMap", framework: "react" },
            { platform: "android", componentSymbol: "GeoSphereGISMap", framework: "compose" },
            { platform: "ios", componentSymbol: "GeoSphereGISMap", framework: "swiftui" }
        ]
    },
    LAYER_SWITCHER: {
        id: "gis.layer-switcher",
        name: "Layer Switcher Control",
        version: "1.0.0",
        moduleId: "gis",
        description: "Control panel for toggling layer visibility, opacity, and z-index ordering",
        inputs: [
            { name: "layers", type: "GeoSphereLayer[]", required: true, description: "List of configurable map layers" }
        ],
        outputs: ["onLayerToggle", "onOpacityChange"],
        events: ["layer.visibilityChanged"],
        requiredPermissions: ["gis.map.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "GeoSphereLayerSwitcher", framework: "react" },
            { platform: "android", componentSymbol: "GeoSphereLayerSwitcher", framework: "compose" },
            { platform: "ios", componentSymbol: "GeoSphereLayerSwitcher", framework: "swiftui" }
        ]
    },
    FEATURE_DETAILS: {
        id: "gis.feature-details",
        name: "Feature Details Inspector",
        version: "1.0.0",
        moduleId: "gis",
        description: "Inspector card displaying selected spatial feature attributes and geometry metadata",
        inputs: [
            { name: "feature", type: "GeoSphereFeature", required: true, description: "Selected feature" }
        ],
        outputs: ["onEdit", "onDelete", "onClose"],
        events: ["feature.updated", "feature.deleted"],
        requiredPermissions: ["gis.feature.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "GeoSphereFeatureDetails", framework: "react" },
            { platform: "android", componentSymbol: "GeoSphereFeatureDetails", framework: "compose" },
            { platform: "ios", componentSymbol: "GeoSphereFeatureDetails", framework: "swiftui" }
        ]
    }
};
export const GIS_READY_MADE_SCREENS = {
    GIS_VIEWER_SCREEN: {
        id: "gis.viewer-screen",
        title: "GIS Viewer Screen",
        version: "1.0.0",
        moduleId: "gis",
        description: "Full interactive GIS map viewer with layer manager and feature inspection overlays",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["map-rendering", "feature-selection"],
        requiredPermissions: ["gis.map.read", "gis.feature.read"],
        containedComponents: ["gis.map", "gis.layer-switcher", "gis.feature-details"],
        adapters: [
            { platform: "web", componentSymbol: "GISViewerScreen", framework: "react" },
            { platform: "android", componentSymbol: "GISViewerScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "GISViewerScreen", framework: "swiftui" }
        ]
    },
    LAYER_MANAGER_SCREEN: {
        id: "gis.layer-manager-screen",
        title: "Layer Manager Screen",
        version: "1.0.0",
        moduleId: "gis",
        description: "Dedicated screen for managing spatial layer catalogues, visibility, and styles",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["layer-management"],
        requiredPermissions: ["gis.map.read"],
        containedComponents: ["gis.layer-switcher"],
        adapters: [
            { platform: "web", componentSymbol: "LayerManagerScreen", framework: "react" },
            { platform: "android", componentSymbol: "LayerManagerScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "LayerManagerScreen", framework: "swiftui" }
        ]
    },
    FEATURE_DETAILS_SCREEN: {
        id: "gis.feature-details-screen",
        title: "Feature Details Screen",
        version: "1.0.0",
        moduleId: "gis",
        description: "Full-screen spatial attribute inspector with geometry preview and action bar",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["feature-inspection"],
        requiredPermissions: ["gis.feature.read"],
        containedComponents: ["gis.feature-details"],
        adapters: [
            { platform: "web", componentSymbol: "FeatureDetailsScreen", framework: "react" },
            { platform: "android", componentSymbol: "FeatureDetailsScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "FeatureDetailsScreen", framework: "swiftui" }
        ]
    },
    FEATURE_EDITOR_SCREEN: {
        id: "gis.feature-editor-screen",
        title: "Feature Editor Screen",
        version: "1.0.0",
        moduleId: "gis",
        description: "Spatial feature creation and geometry editing screen",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["geometry-editing"],
        requiredPermissions: ["gis.feature.read", "gis.feature.create", "gis.feature.update"],
        containedComponents: ["gis.map", "gis.feature-details"],
        adapters: [
            { platform: "web", componentSymbol: "FeatureEditorScreen", framework: "react" },
            { platform: "android", componentSymbol: "FeatureEditorScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "FeatureEditorScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=gis-ui.contracts.js.map