/**
 * Visualization Engine — Zod Schemas & Validation
 *
 * Safe schema parsing and validation for GIS layer definitions, dynamic styles,
 * filter rules, label rules, legends, clustering, and heatmaps.
 */

import { z } from "zod";

export const FeatureStyleSchema = z.object({
  fillColor: z.string().optional(),
  fillOpacity: z.number().min(0).max(1).optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().min(0).optional(),
  strokeDashArray: z.array(z.number()).optional(),
  circleRadius: z.number().min(0).optional(),
  iconUrl: z.string().optional(),
  iconScale: z.number().min(0).optional(),
  iconRotation: z.number().optional(),
  label: z.string().optional(),
  labelColor: z.string().optional(),
  labelFont: z.string().optional(),
  labelOffsetY: z.number().optional(),
  zIndex: z.number().optional(),
});

export const IconConfigSchema = z.object({
  url: z.string().optional(),
  svg: z.string().optional(),
  size: z.tuple([z.number(), z.number()]).optional(),
  scale: z.number().min(0).optional(),
  rotation: z.number().min(0).max(360).optional(),
  anchor: z.tuple([z.number(), z.number()]).optional(),
});

export const SingleStyleRuleSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal("single"),
  priority: z.number(),
  style: FeatureStyleSchema,
  icon: IconConfigSchema.optional(),
});

export const PropertyBasedStyleRuleSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal("property"),
  priority: z.number(),
  style: FeatureStyleSchema,
  icon: IconConfigSchema.optional(),
  property: z.string(),
  operator: z.enum(["equals", "not_equals", "contains", "in"]),
  value: z.unknown(),
});

export const NumericRangeStyleRuleSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.literal("numeric_range"),
  priority: z.number(),
  style: FeatureStyleSchema,
  icon: IconConfigSchema.optional(),
  property: z.string(),
  min: z.number(),
  max: z.number(),
  includeMin: z.boolean().optional(),
  includeMax: z.boolean().optional(),
});

export const StyleRuleSchema = z.discriminatedUnion("type", [
  SingleStyleRuleSchema,
  PropertyBasedStyleRuleSchema,
  NumericRangeStyleRuleSchema,
]);

export const FilterOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
  "greater_or_equal",
  "less_or_equal",
  "contains",
  "in",
  "not_in",
  "between",
]);

export const FilterRuleSchema = z.object({
  id: z.string(),
  field: z.string(),
  operator: FilterOperatorSchema,
  value: z.unknown(),
});

export const FilterRuleGroupSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    logicalOperator: z.enum(["AND", "OR"]),
    rules: z.array(FilterRuleSchema),
    groups: z.array(FilterRuleGroupSchema).optional(),
  }),
);

export const LabelConfigSchema = z.object({
  enabled: z.boolean(),
  property: z.string().optional(),
  textTemplate: z.string().optional(),
  font: z.string().optional(),
  fontSize: z.number().positive().optional(),
  color: z.string().optional(),
  outlineColor: z.string().optional(),
  outlineWidth: z.number().min(0).optional(),
  offsetY: z.number().optional(),
  offsetX: z.number().optional(),
  minZoom: z.number().min(0).max(28).optional(),
  maxZoom: z.number().min(0).max(28).optional(),
  priority: z.number().optional(),
  placement: z.enum(["point", "line"]).optional(),
});

export const LegendItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  symbolType: z.enum(["circle", "line", "polygon", "icon"]),
  color: z.string().optional(),
  strokeColor: z.string().optional(),
  iconUrl: z.string().optional(),
});

export const LegendConfigSchema = z.object({
  title: z.string().optional(),
  position: z
    .enum(["top-right", "top-left", "bottom-right", "bottom-left"])
    .optional(),
  visible: z.boolean(),
  collapsed: z.boolean().optional(),
  items: z.array(LegendItemSchema).optional(),
});

export const ClusterConfigSchema = z.object({
  enabled: z.boolean(),
  radius: z.number().min(1).optional(),
  minClusterSize: z.number().min(1).optional(),
  clusterColor: z.string().optional(),
  textColor: z.string().optional(),
  minZoom: z.number().min(0).max(28).optional(),
  maxZoom: z.number().min(0).max(28).optional(),
});

export const HeatmapConfigSchema = z.object({
  enabled: z.boolean(),
  radius: z.number().min(1).optional(),
  blur: z.number().min(0).optional(),
  opacity: z.number().min(0).max(1).optional(),
  weightField: z.string().optional(),
  weightMin: z.number().optional(),
  weightMax: z.number().optional(),
});

export const GISLayerDefinitionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    "base",
    "vector",
    "raster",
    "tile",
    "cluster",
    "heatmap",
    "label",
    "overlay",
  ]),
  source: z
    .object({
      type: z.enum([
        "static_geojson",
        "spatial_api",
        "vector_tiles",
        "external_provider",
      ]),
      url: z.string().optional(),
      geojson: z.record(z.unknown()).optional(),
      params: z.record(z.unknown()).optional(),
    })
    .optional(),
  visible: z.boolean(),
  opacity: z.number().min(0).max(1),
  zIndex: z.number(),
  minZoom: z.number().min(0).max(28).optional(),
  maxZoom: z.number().min(0).max(28).optional(),
  groupId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const LayerGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  visible: z.boolean(),
  expanded: z.boolean().optional(),
  order: z.number(),
});

export const VisualizationConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  layerId: z.string(),
  version: z.number().default(1),
  scope: z.enum(["platform", "tenant", "application", "user"]).optional(),
  defaultStyle: FeatureStyleSchema,
  styleRules: z.array(StyleRuleSchema),
  filterRules: FilterRuleGroupSchema.optional(),
  labelConfig: LabelConfigSchema.optional(),
  legendConfig: LegendConfigSchema.optional(),
  clusterConfig: ClusterConfigSchema.optional(),
  heatmapConfig: HeatmapConfigSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const MapConfigurationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  center: z.tuple([z.number(), z.number()]),
  zoom: z.number().min(0).max(28),
  baseMap: z.string(),
  layers: z.array(GISLayerDefinitionSchema),
  layerGroups: z.array(LayerGroupSchema),
  visualizationConfigs: z.record(VisualizationConfigSchema),
  legend: LegendConfigSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});
