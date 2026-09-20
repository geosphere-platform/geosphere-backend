/**
 * GeoSphere Spatial Analysis SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */
export const SPATIAL_ANALYSIS_UI_COMPONENTS = {
    DISTANCE_MEASUREMENT: {
        id: "spatialAnalysis.distance-measurement-tool",
        name: "Distance Measurement Tool",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Interactive point-to-point distance measurement tool component",
        inputs: [
            { name: "units", type: "string", required: false, description: "Measurement units" }
        ],
        outputs: ["onMeasureComplete"],
        events: ["spatialAnalysis.measured"],
        requiredPermissions: ["spatialAnalysis.measure"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "DistanceMeasurement", framework: "react" },
            { platform: "android", componentSymbol: "DistanceMeasurement", framework: "compose" },
            { platform: "ios", componentSymbol: "DistanceMeasurement", framework: "swiftui" }
        ]
    },
    BUFFER_CONTROL: {
        id: "spatialAnalysis.buffer-control-panel",
        name: "Buffer Analysis Control Panel",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Interactive buffer radius slider and buffer polygon generator component",
        inputs: [
            { name: "defaultRadiusMeters", type: "number", required: false, description: "Initial buffer distance" }
        ],
        outputs: ["onBufferGenerated"],
        events: ["spatialAnalysis.buffered"],
        requiredPermissions: ["spatialAnalysis.geometryOperations"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "BufferControl", framework: "react" },
            { platform: "android", componentSymbol: "BufferControl", framework: "compose" },
            { platform: "ios", componentSymbol: "BufferControl", framework: "swiftui" }
        ]
    },
    MEASUREMENT_RESULT: {
        id: "spatialAnalysis.measurement-result-card",
        name: "Measurement Result Card",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Formatted card rendering distance, area, length, or bearing measurement output",
        inputs: [
            { name: "result", type: "GeoSphereMeasurementResult", required: true, description: "Measurement result object" }
        ],
        outputs: [],
        events: ["spatialAnalysis.measured"],
        requiredPermissions: ["spatialAnalysis.read"],
        supportedPlatforms: ["web", "android", "ios"],
        supportsDensity: ["compact", "comfortable", "spacious"],
        supportsBreakpoints: ["mobile", "tablet", "desktop"],
        adapters: [
            { platform: "web", componentSymbol: "MeasurementResult", framework: "react" },
            { platform: "android", componentSymbol: "MeasurementResult", framework: "compose" },
            { platform: "ios", componentSymbol: "MeasurementResult", framework: "swiftui" }
        ]
    }
};
export const SPATIAL_ANALYSIS_READY_MADE_SCREENS = {
    SPATIAL_ANALYSIS_SCREEN: {
        id: "spatialAnalysis.main-screen",
        title: "Spatial Analysis Studio Screen",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Comprehensive GIS spatial analysis workspace combining distance/area tools, buffer controls, and spatial queries",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["DISTANCE", "AREA", "BUFFER", "SPATIAL_RELATIONSHIPS"],
        requiredPermissions: ["spatialAnalysis.read"],
        containedComponents: ["spatialAnalysis.distance-measurement-tool", "spatialAnalysis.buffer-control-panel", "spatialAnalysis.measurement-result-card"],
        adapters: [
            { platform: "web", componentSymbol: "SpatialAnalysisScreen", framework: "react" },
            { platform: "android", componentSymbol: "SpatialAnalysisScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "SpatialAnalysisScreen", framework: "swiftui" }
        ]
    },
    MEASUREMENT_SCREEN: {
        id: "spatialAnalysis.measurement-screen",
        title: "GIS Measurement Studio Screen",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Dedicated measurement workspace for distance, polygon area, length, and bearing calculations",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["DISTANCE", "AREA", "LENGTH", "BEARING"],
        requiredPermissions: ["spatialAnalysis.measure"],
        containedComponents: ["spatialAnalysis.distance-measurement-tool", "spatialAnalysis.measurement-result-card"],
        adapters: [
            { platform: "web", componentSymbol: "MeasurementScreen", framework: "react" },
            { platform: "android", componentSymbol: "MeasurementScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "MeasurementScreen", framework: "swiftui" }
        ]
    },
    BUFFER_ANALYSIS_SCREEN: {
        id: "spatialAnalysis.buffer-screen",
        title: "Buffer & Proximity Analysis Screen",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Buffer polygon generation and spatial proximity analysis workspace",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["BUFFER"],
        requiredPermissions: ["spatialAnalysis.geometryOperations"],
        containedComponents: ["spatialAnalysis.buffer-control-panel"],
        adapters: [
            { platform: "web", componentSymbol: "BufferAnalysisScreen", framework: "react" },
            { platform: "android", componentSymbol: "BufferAnalysisScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "BufferAnalysisScreen", framework: "swiftui" }
        ]
    },
    RELATIONSHIP_SCREEN: {
        id: "spatialAnalysis.relationship-screen",
        title: "Spatial Relationships Inspector Screen",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Topological relationship inspector testing CONTAINS, WITHIN, INTERSECTS, and TOUCHES relations",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["SPATIAL_RELATIONSHIPS"],
        requiredPermissions: ["spatialAnalysis.read"],
        containedComponents: ["spatialAnalysis.measurement-result-card"],
        adapters: [
            { platform: "web", componentSymbol: "SpatialRelationshipScreen", framework: "react" },
            { platform: "android", componentSymbol: "SpatialRelationshipScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "SpatialRelationshipScreen", framework: "swiftui" }
        ]
    },
    NEAREST_FEATURE_SCREEN: {
        id: "spatialAnalysis.nearest-screen",
        title: "Nearest Feature Search Screen",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Nearest spatial feature analyzer calculating point-to-feature distances",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["NEAREST"],
        requiredPermissions: ["spatialAnalysis.read"],
        containedComponents: ["spatialAnalysis.measurement-result-card"],
        adapters: [
            { platform: "web", componentSymbol: "NearestFeatureScreen", framework: "react" },
            { platform: "android", componentSymbol: "NearestFeatureScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "NearestFeatureScreen", framework: "swiftui" }
        ]
    },
    SPATIAL_QUERY_SCREEN: {
        id: "spatialAnalysis.query-screen",
        title: "Spatial Query Builder Screen",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Visual spatial query builder querying features by bbox, radius, or containment polygon",
        mode: "full-screen",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["SPATIAL_QUERY"],
        requiredPermissions: ["spatialAnalysis.query"],
        containedComponents: ["spatialAnalysis.buffer-control-panel"],
        adapters: [
            { platform: "web", componentSymbol: "SpatialQueryScreen", framework: "react" },
            { platform: "android", componentSymbol: "SpatialQueryScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "SpatialQueryScreen", framework: "swiftui" }
        ]
    },
    CLUSTERING_SCREEN: {
        id: "spatialAnalysis.clustering-screen",
        title: "Spatial Point Clustering Screen",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Point feature clustering configuration and visualization workspace",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["CLUSTERING"],
        requiredPermissions: ["spatialAnalysis.read"],
        containedComponents: ["spatialAnalysis.measurement-result-card"],
        adapters: [
            { platform: "web", componentSymbol: "ClusteringScreen", framework: "react" },
            { platform: "android", componentSymbol: "ClusteringScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "ClusteringScreen", framework: "swiftui" }
        ]
    },
    ANALYSIS_RESULT_SCREEN: {
        id: "spatialAnalysis.results-screen",
        title: "Spatial Analysis Results Inspector Screen",
        version: "1.0.0",
        moduleId: "spatialAnalysis",
        description: "Summary inspector for spatial operation results, areas, and topological queries",
        mode: "component",
        supportedPlatforms: ["web", "android", "ios"],
        requiredCapabilities: ["DISTANCE", "AREA"],
        requiredPermissions: ["spatialAnalysis.read"],
        containedComponents: ["spatialAnalysis.measurement-result-card"],
        adapters: [
            { platform: "web", componentSymbol: "AnalysisResultScreen", framework: "react" },
            { platform: "android", componentSymbol: "AnalysisResultScreen", framework: "compose" },
            { platform: "ios", componentSymbol: "AnalysisResultScreen", framework: "swiftui" }
        ]
    }
};
//# sourceMappingURL=spatial-analysis-ui.contracts.js.map