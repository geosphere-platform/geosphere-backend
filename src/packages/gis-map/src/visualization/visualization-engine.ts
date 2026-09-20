/**
 * Visualization Engine — Main Coordinator Engine
 *
 * Business-agnostic coordinator orchestrating Style, Filter, Label, Legend,
 * Cluster, and Heatmap engines along with Layer Management and dynamic updates.
 */

import { FeatureStyle, MapFeature } from "../types";
import { StyleEngine } from "./style-engine";
import { FilterEngine } from "./filter-engine";
import { LabelEngine } from "./label-engine";
import { LegendEngine } from "./legend-engine";
import { ClusterEngine } from "./cluster-engine";
import { HeatmapEngine } from "./heatmap-engine";
import { LayerTreeManager } from "./layer-tree";
import {
  FilterDefinition,
  GISLayerDefinition,
  LegendConfig,
  VisualizationConfig,
} from "./types";
import { VisualizationConfigSchema } from "./schemas";
import { StructuredMapError } from "../errors/map-errors";

export class VisualizationEngine {
  public readonly styleEngine: StyleEngine;
  public readonly filterEngine: FilterEngine;
  public readonly labelEngine: LabelEngine;
  public readonly legendEngine: LegendEngine;
  public readonly clusterEngine: ClusterEngine;
  public readonly heatmapEngine: HeatmapEngine;
  public readonly layerTreeManager: LayerTreeManager;

  private configs: Map<string, VisualizationConfig> = new Map();

  constructor() {
    this.styleEngine = new StyleEngine();
    this.filterEngine = new FilterEngine();
    this.labelEngine = new LabelEngine();
    this.legendEngine = new LegendEngine();
    this.clusterEngine = new ClusterEngine();
    this.heatmapEngine = new HeatmapEngine();
    this.layerTreeManager = new LayerTreeManager();
  }

  /**
   * Register or update a VisualizationConfig (validated against schema).
   */
  public registerConfig(config: VisualizationConfig): void {
    const parsed = VisualizationConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new StructuredMapError(
        "INVALID_CONFIG",
        `Invalid VisualizationConfig for '${config?.id}': ${parsed.error.message}`,
      );
    }

    this.configs.set(parsed.data.layerId, parsed.data as VisualizationConfig);
    this.styleEngine.clearCache();
  }

  public getConfig(layerId: string): VisualizationConfig | undefined {
    return this.configs.get(layerId);
  }

  public removeConfig(layerId: string): void {
    this.configs.delete(layerId);
    this.styleEngine.clearCache();
  }

  /**
   * Feature Rendering Pipeline:
   * Feature → Filter Engine → Style Engine → Label Engine → Effective Feature Payload
   */
  public processFeature(
    feature: MapFeature,
    layerId: string,
    currentZoom?: number,
  ): { feature: MapFeature; style: FeatureStyle; visible: boolean } {
    const config = this.configs.get(layerId);
    if (!config) {
      return {
        feature,
        style: feature.style || {},
        visible: feature.visible ?? true,
      };
    }

    // 1. Filter evaluation
    const passFilter = this.filterEngine.evaluateRuleGroup(
      feature,
      config.filterRules || { logicalOperator: "AND", rules: [] },
    );
    if (!passFilter) {
      return { feature, style: {}, visible: false };
    }

    // 2. Style Engine evaluation
    const calculatedStyle = this.styleEngine.evaluateStyle(feature, config);

    // 3. Label Engine evaluation
    const labelProps = this.labelEngine.evaluateLabel(
      feature,
      config.labelConfig,
      currentZoom,
    );

    const mergedStyle: FeatureStyle = {
      ...calculatedStyle,
      ...labelProps,
    };

    return {
      feature,
      style: mergedStyle,
      visible: true,
    };
  }

  /**
   * Process a batch of features through the filter and style pipeline.
   */
  public processFeatureBatch(
    features: MapFeature[],
    layerId: string,
    currentZoom?: number,
  ): MapFeature[] {
    const config = this.configs.get(layerId);
    if (!config) return features;

    // Filter step
    const visibleFeatures = this.filterEngine.filterFeatures(
      features,
      config.filterRules,
    );

    // Style step
    return visibleFeatures.map((feat) => {
      const processed = this.processFeature(feat, layerId, currentZoom);
      return {
        ...feat,
        style: processed.style,
        visible: processed.visible,
      };
    });
  }

  /**
   * Synthesize Legend for a given layer.
   */
  public getLegendForLayer(layerId: string): LegendConfig | undefined {
    const config = this.configs.get(layerId);
    if (!config) return undefined;
    return this.legendEngine.generateLegend(config);
  }

  /**
   * Generate UI filter metadata definitions for features in a layer.
   */
  public getFilterDefinitionsForFeatures(
    features: MapFeature[],
  ): FilterDefinition[] {
    return this.filterEngine.generateFilterDefinitions(features);
  }
}
