/**
 * GIS Map SDK — Main Export Entrypoint
 *
 * Reusable, business-agnostic GIS Map SDK abstractions and controls.
 */

// Core GISMap Abstraction & Adapters
export { GISMap } from "./map/map";
export { createMapOptions } from "./map/options";
export { OpenLayersAdapter } from "./adapters/openlayers/openlayers-adapter";
export type { IMapAdapter, IFeatureRendererAdapter } from "./adapters/map-adapter.interface";

// Viewport & Basemaps
export { Viewport } from "./view/viewport";
export { BasemapManager, DEFAULT_BASEMAPS, type BasemapConfig, type BasemapCategory } from "./basemap/basemap-manager";

// Layer System
export { BaseGISLayer } from "./layers/layer";
export { VectorLayer } from "./layers/vector-layer";
export { TileLayer } from "./layers/tile-layer";
export { ClusterLayer } from "./layers/cluster-layer";
export { HeatmapLayer } from "./layers/heatmap-layer";
export { LayerManager } from "./layers/layer-manager";

// Features & Markers
export { createMapFeature, validateMapFeature } from "./features/feature";
export { FeatureManager } from "./features/feature-manager";
export { markerToFeature } from "./markers/marker";
export { GeoJsonConverter } from "./geojson/geojson-converter";

// Styling Primitives & Advanced Symbology Engine
export {
  createFeatureStyle,
  mergeStyles,
  DEFAULT_FEATURE_STYLE,
} from "./styling/style";
export {
  GeoSphereSymbologyEvaluator,
  DEFAULT_GEOSPHERE_STYLE,
  type GeoSphereStyle,
  type GeoSphereSymbol,
  type GeoSphereLabelStyle,
  type GeoSphereRule,
  type GeoSphereClassification,
  type PointSymbolShape,
  type LineDashPattern,
  type LineCapType,
  type LineJoinType,
  type PolygonPatternType,
} from "./styling/symbology-engine";
export {
  GEOSPHERE_STYLE_PRESETS,
  GeoSphereStyleSerializer,
  type GeoSphereStylePreset,
} from "./styling/style-preset-registry";
export { GeoSphereAdvancedStyleEditor } from "./react/AdvancedStyleEditor";

// Selection & Popups
export { SelectionManager } from "./selection/selection-manager";
export { MapPopup } from "./popup/popup";

// Controls, Search, Snapping, Temporal, Tracking, Geofence, Offline, Diagnostics & Interactions
export { MapControlManager } from "./controls/controls";
export { CoordinateSearchProvider, FeatureSearchProvider, type ISearchProvider, type SearchResultItem } from "./search/search-provider";
export { SnappingEngine, type SnappingConfig, type SnapResult } from "./snapping/snapping-engine";
export { TemporalEngine, type TemporalConfig, type TemporalTickListener } from "./temporal/temporal-engine";
export { TelemetryTrackingEngine, type TelemetryPoint, type SubjectTrack } from "./tracking/telemetry-engine";
export { GeofenceEngine, type GeofenceZone, type GeofenceTransitionEvent, type GeofenceTransitionType } from "./geofence/geofence-engine";
export { OfflineTileCacheManager, type TilePackageSpec, type OfflineCacheStats } from "./offline/offline-manager";
export { MapDiagnosticsEngine, type DiagnosticsMetrics } from "./diagnostics/diagnostics-engine";
export { DrawingManager } from "./drawing/drawing-manager";
export { EditingManager } from "./editing/editing-manager";
export {
  GeoSphereGeometryEngine,
  GeoSphereTopologyValidator,
  GeoSphereEditHistory,
  type UniversalGeometryType,
  type GeoSphereGeometry,
  type GeoSphereFeatureMetadata,
  type GeoSphereFeature as UniversalGeoSphereFeature,
  type TopologyValidationError,
  type SnapConfig,
  type EditOperationType,
  type EditHistoryRecord,
} from "./editing/geospatial-editing-engine";
export {
  GeoSphereSchemaValidator,
  type GeoSphereFieldDefinition,
  type GeoSphereFeatureSchema,
  type SchemaValidationError,
} from "./features/feature-schema";
export {
  GeoSphereFeatureEditor,
  GeoSphereFeatureDetailsScreen,
} from "./react/FeatureEditor";
export { GeoSphereSelectionFirstEditor } from "./react/SelectionFirstEditor";
export {
  GeoSphereOperationMatrix,
  GeoSphereJurisdictionGuard,
  createDefaultLayerPolicy,
  createDefaultGeometryPolicy,
  type GeoSphereLayerEditPolicy,
  type GeoSphereGeometryPolicy,
  type GeoSphereTopologyPolicy,
  type GeoSphereJurisdictionPolicy,
  type GeoSphereEditSession,
  type OperationType,
  type OverlapPolicy,
} from "./editing/edit-policy-engine";
export { InteractionManager } from "./interactions/interaction";

// Jurisdiction & Business Profiles
export { JurisdictionEngine, type JurisdictionLevel, type JurisdictionNode, type JurisdictionFilterOptions } from "./jurisdiction/jurisdiction-engine";
export { MapProfileManager, BUSINESS_PROFILE_PRESETS, type BusinessProfileType, type MapProfileConfig } from "./profiles/profile-manager";

// Geospatial Measurement
export { MeasurementEngine } from "./measurement/measurement";

// Data Sources & Clustering/Heatmap Helpers
export {
  StaticMapDataSource,
  BoundingBoxMapDataSource,
} from "./datasource/data-source";
export { ViewportSpatialLoader } from "./datasource/viewport-spatial-loader";
export { createPointClusterOptions } from "./clustering/cluster-options";
export { createHeatmapOptions } from "./heatmap/heatmap-options";

// Error Handling & Events
export { StructuredMapError } from "./errors/map-errors";
export { MapEventEmitter } from "./events/event-emitter";

// React Integration
export { MapView } from "./react/MapView";
export { useGISMap } from "./react/useGISMap";

// Visualization Engine (Phase 7)
export {
  VisualizationEngine,
  StyleEngine,
  FilterEngine,
  LabelEngine,
  LegendEngine,
  ClusterEngine,
  HeatmapEngine,
  LayerTreeManager,
  type LayerTreeNode,
} from "./visualization";

export * from "./visualization/types";
export * from "./visualization/schemas";

// TypeScript Interfaces & Types
export type {
  MapOptions,
  Coordinate,
  SpatialReference,
  BoundingBoxTuple,
  Geometry,
  MapFeature,
  MapMarker,
  FeatureStyle,
  GISLayerConfig,
  LayerType,
  BaseTileProvider,
  PointClusterOptions,
  HeatmapLayerOptions,
  MapControlConfig,
  ViewportState,
  MeasurementUnitLength,
  MeasurementUnitArea,
  MeasurementResult,
  DrawType,
  MapInteractionType,
  MapEventType,
  MapEventPayloadMap,
  MapEventListener,
  MapDataSource,
} from "./types";
