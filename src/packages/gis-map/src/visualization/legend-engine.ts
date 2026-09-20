/**
 * Visualization Engine — Legend Engine
 *
 * Synthesizes business-agnostic map legend configurations directly from
 * visualization rules (single, property categories, numeric ranges).
 */

import {
  LegendConfig,
  LegendItem,
  StyleRule,
  VisualizationConfig,
} from "./types";

export class LegendEngine {
  /**
   * Generate complete LegendConfig for a VisualizationConfig.
   */
  public generateLegend(config: VisualizationConfig): LegendConfig {
    if (config.legendConfig) {
      if (config.legendConfig.items && config.legendConfig.items.length > 0) {
        return config.legendConfig;
      }
    }

    const items: LegendItem[] = [];

    // Synthesize legend items from style rules
    for (const rule of config.styleRules) {
      const item = this.createLegendItemFromRule(rule, config);
      if (item) {
        items.push(item);
      }
    }

    // Default item if no items generated
    if (items.length === 0) {
      items.push({
        id: `${config.id}_default`,
        label: config.name || "Default Features",
        symbolType: "circle",
        color: config.defaultStyle.fillColor || "#3b82f6",
        strokeColor: config.defaultStyle.strokeColor || "#1d4ed8",
      });
    }

    return {
      title: config.legendConfig?.title || config.name || "Map Legend",
      position: config.legendConfig?.position || "bottom-right",
      visible: config.legendConfig?.visible ?? true,
      collapsed: config.legendConfig?.collapsed ?? false,
      items,
    };
  }

  private createLegendItemFromRule(
    rule: StyleRule,
    config: VisualizationConfig,
  ): LegendItem | null {
    const symbolType = rule.icon
      ? "icon"
      : rule.style.strokeWidth && !rule.style.fillColor
        ? "line"
        : rule.style.fillColor && rule.style.strokeWidth
          ? "polygon"
          : "circle";

    const color =
      rule.style.fillColor || config.defaultStyle.fillColor || "#3b82f6";
    const strokeColor =
      rule.style.strokeColor || config.defaultStyle.strokeColor || "#1d4ed8";
    const iconUrl = rule.icon?.url || rule.style.iconUrl;

    let label = rule.name || rule.id;

    if (rule.type === "property") {
      label = rule.name || `${rule.property} = ${rule.value}`;
    } else if (rule.type === "numeric_range") {
      label = rule.name || `${rule.property}: ${rule.min} - ${rule.max}`;
    }

    return {
      id: rule.id,
      label,
      symbolType,
      color,
      strokeColor,
      iconUrl,
    };
  }
}
