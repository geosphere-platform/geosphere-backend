/**
 * Visualization Engine — Style Engine
 *
 * Generic, high-performance styling engine evaluating property-based rules,
 * numeric ranges, static overrides, fallback defaults, and icon rotation.
 * Features an internal LRU/map cache for feature styles.
 */

import { FeatureStyle, MapFeature } from "../types";
import {
  NumericRangeStyleRule,
  PropertyBasedStyleRule,
  SingleStyleRule,
  StyleRule,
  VisualizationConfig,
} from "./types";

export class StyleEngine {
  private styleCache: Map<string, FeatureStyle> = new Map();

  /**
   * Evaluate effective FeatureStyle for a feature using the given VisualizationConfig.
   */
  public evaluateStyle(
    feature: MapFeature,
    config: VisualizationConfig,
  ): FeatureStyle {
    const cacheKey = this.generateCacheKey(feature, config);
    if (this.styleCache.has(cacheKey)) {
      return this.styleCache.get(cacheKey)!;
    }

    const matchedRule = this.findMatchingRule(feature, config.styleRules);
    let effectiveStyle: FeatureStyle;

    if (matchedRule) {
      effectiveStyle = { ...config.defaultStyle, ...matchedRule.style };
      if (matchedRule.icon) {
        if (matchedRule.icon.url) effectiveStyle.iconUrl = matchedRule.icon.url;
        if (matchedRule.icon.scale !== undefined)
          effectiveStyle.iconScale = matchedRule.icon.scale;
        if (matchedRule.icon.rotation !== undefined)
          effectiveStyle.iconRotation = matchedRule.icon.rotation;
      }
    } else {
      effectiveStyle = { ...config.defaultStyle };
    }

    // Dynamic property-based feature rotation support (e.g. properties.rotation = 180)
    if (feature.properties && typeof feature.properties.rotation === "number") {
      effectiveStyle.iconRotation = feature.properties.rotation;
    }

    // Dynamic property-based label support fallback
    if (!effectiveStyle.label && feature.properties) {
      if (typeof feature.properties.name === "string") {
        effectiveStyle.label = feature.properties.name;
      } else if (typeof feature.properties.title === "string") {
        effectiveStyle.label = feature.properties.title;
      }
    }

    this.styleCache.set(cacheKey, effectiveStyle);
    return effectiveStyle;
  }

  /**
   * Clear calculated style cache (e.g. when dynamic configs change).
   */
  public clearCache(): void {
    this.styleCache.clear();
  }

  /**
   * Find matching rule sorted by highest priority.
   */
  private findMatchingRule(
    feature: MapFeature,
    rules: StyleRule[],
  ): StyleRule | undefined {
    if (!rules || rules.length === 0) return undefined;

    // Sort rules by priority descending (highest priority first)
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sorted) {
      if (this.matchesRule(feature, rule)) {
        return rule;
      }
    }

    return undefined;
  }

  /**
   * Evaluate whether a single feature satisfies a StyleRule.
   */
  private matchesRule(feature: MapFeature, rule: StyleRule): boolean {
    const props = feature.properties || {};

    switch (rule.type) {
      case "single":
        return true;

      case "property": {
        const propRule = rule as PropertyBasedStyleRule;
        const val = props[propRule.property];
        return this.evaluatePropertyRule(
          val,
          propRule.operator,
          propRule.value,
        );
      }

      case "numeric_range": {
        const numRule = rule as NumericRangeStyleRule;
        const val = props[numRule.property];
        if (typeof val !== "number" || isNaN(val)) return false;

        const incMin = numRule.includeMin ?? true;
        const incMax = numRule.includeMax ?? true;

        const minMatch = incMin ? val >= numRule.min : val > numRule.min;
        const maxMatch = incMax ? val <= numRule.max : val < numRule.max;

        return minMatch && maxMatch;
      }

      default:
        return false;
    }
  }

  private evaluatePropertyRule(
    featureVal: unknown,
    operator: "equals" | "not_equals" | "contains" | "in",
    targetVal: unknown,
  ): boolean {
    if (featureVal === undefined || featureVal === null) {
      return operator === "not_equals";
    }

    switch (operator) {
      case "equals":
        return String(featureVal) === String(targetVal);

      case "not_equals":
        return String(featureVal) !== String(targetVal);

      case "contains":
        return String(featureVal)
          .toLowerCase()
          .includes(String(targetVal).toLowerCase());

      case "in":
        if (Array.isArray(targetVal)) {
          return targetVal.map(String).includes(String(featureVal));
        }
        return false;

      default:
        return false;
    }
  }

  private generateCacheKey(
    feature: MapFeature,
    config: VisualizationConfig,
  ): string {
    const featurePropsKey = JSON.stringify(feature.properties || {});
    return `${config.id}_${feature.id}_${featurePropsKey}`;
  }
}
