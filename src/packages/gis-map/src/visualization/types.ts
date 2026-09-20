/**
 * Visualization Engine — TypeScript Definitions
 *
 * Business-agnostic types for GIS layer definitions, dynamic style rules,
 * filters, labels, legends, clustering, heatmaps, and map configurations.
 */

import { FeatureStyle, Geometry, LayerType } from "../types";

export type LayerScope = "platform" | "tenant" | "application" | "user";

export type DataSourceType =
  "static_geojson" | "spatial_api" | "vector_tiles" | "external_provider";

export interface LayerDataSourceConfig {
  type: DataSourceType;
  url?: string;
  geojson?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface GISLayerDefinition {
  id: string;
  name: string;
  description?: string;
  type: LayerType | "base" | "raster" | "label" | "overlay";
  source?: LayerDataSourceConfig;
  visible: boolean;
  opacity: number;
  zIndex: number;
  minZoom?: number;
  maxZoom?: number;
  groupId?: string;
  metadata?: Record<string, unknown>;
}

export interface LayerGroup {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  visible: boolean;
  expanded?: boolean;
  order: number;
}

// Icon abstraction
export interface IconConfig {
  url?: string;
  svg?: string;
  size?: [number, number];
  scale?: number;
  rotation?: number; // 0–360 degrees
  anchor?: [number, number];
}

// Dynamic Style Rules
export type StyleRuleType = "single" | "property" | "numeric_range";

export interface BaseStyleRule {
  id: string;
  name?: string;
  type: StyleRuleType;
  priority: number; // Higher priority overrides lower priority rules
  style: FeatureStyle;
  icon?: IconConfig;
}

export interface SingleStyleRule extends BaseStyleRule {
  type: "single";
}

export interface PropertyBasedStyleRule extends BaseStyleRule {
  type: "property";
  property: string;
  operator: "equals" | "not_equals" | "contains" | "in";
  value: unknown;
}

export interface NumericRangeStyleRule extends BaseStyleRule {
  type: "numeric_range";
  property: string;
  min: number;
  max: number;
  includeMin?: boolean;
  includeMax?: boolean;
}

export type StyleRule =
  SingleStyleRule | PropertyBasedStyleRule | NumericRangeStyleRule;

// Filter Rules
export type FilterOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_or_equal"
  | "less_or_equal"
  | "contains"
  | "in"
  | "not_in"
  | "between";

export interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterRuleGroup {
  logicalOperator: "AND" | "OR";
  rules: FilterRule[];
  groups?: FilterRuleGroup[];
}

export type FilterFieldType =
  "string" | "number" | "boolean" | "date" | "enum" | "geometry";

export interface FilterDefinition {
  field: string;
  label: string;
  type: FilterFieldType;
  operators: FilterOperator[];
  options?: Array<{ label: string; value: unknown }>;
}

// Label Engine
export interface LabelConfig {
  enabled: boolean;
  property?: string;
  textTemplate?: string; // e.g. "{name} - {status}"
  font?: string;
  fontSize?: number;
  color?: string;
  outlineColor?: string;
  outlineWidth?: number;
  offsetY?: number;
  offsetX?: number;
  minZoom?: number;
  maxZoom?: number;
  priority?: number;
  placement?: "point" | "line";
}

// Legend Engine
export interface LegendItem {
  id: string;
  label: string;
  symbolType: "circle" | "line" | "polygon" | "icon";
  color?: string;
  strokeColor?: string;
  iconUrl?: string;
}

export interface LegendConfig {
  title?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  visible: boolean;
  collapsed?: boolean;
  items?: LegendItem[];
}

// Clustering & Heatmaps
export interface ClusterConfig {
  enabled: boolean;
  radius?: number;
  minClusterSize?: number;
  clusterColor?: string;
  textColor?: string;
  minZoom?: number;
  maxZoom?: number;
}

export interface HeatmapConfig {
  enabled: boolean;
  radius?: number;
  blur?: number;
  opacity?: number;
  weightField?: string;
  weightMin?: number;
  weightMax?: number;
}

// Complete Visualization Configuration
export interface VisualizationConfig {
  id: string;
  name: string;
  layerId: string;
  version: number;
  scope?: LayerScope;
  defaultStyle: FeatureStyle;
  styleRules: StyleRule[];
  filterRules?: FilterRuleGroup;
  labelConfig?: LabelConfig;
  legendConfig?: LegendConfig;
  clusterConfig?: ClusterConfig;
  heatmapConfig?: HeatmapConfig;
  metadata?: Record<string, unknown>;
}

// Full Map Configuration
export interface MapConfiguration {
  id: string;
  name: string;
  description?: string;
  center: [number, number];
  zoom: number;
  baseMap: string;
  layers: GISLayerDefinition[];
  layerGroups: LayerGroup[];
  visualizationConfigs: Record<string, VisualizationConfig>;
  legend?: LegendConfig;
  metadata?: Record<string, unknown>;
}
