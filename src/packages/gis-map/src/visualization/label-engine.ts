/**
 * Visualization Engine — Label Engine
 *
 * Configurable, property-driven text labels with zoom-dependent visibility
 * rules, template interpolation, and style composition.
 */

import { FeatureStyle, MapFeature } from "../types";
import { LabelConfig } from "./types";

export class LabelEngine {
  /**
   * Evaluate effective label text and styling for a feature based on LabelConfig and current zoom level.
   */
  public evaluateLabel(
    feature: MapFeature,
    labelConfig?: LabelConfig,
    currentZoom?: number,
  ): Partial<FeatureStyle> {
    if (!labelConfig || !labelConfig.enabled) {
      return {};
    }

    // Zoom range visibility check
    if (currentZoom !== undefined) {
      if (
        labelConfig.minZoom !== undefined &&
        currentZoom < labelConfig.minZoom
      ) {
        return { label: undefined };
      }
      if (
        labelConfig.maxZoom !== undefined &&
        currentZoom > labelConfig.maxZoom
      ) {
        return { label: undefined };
      }
    }

    // Resolve text
    const labelText = this.resolveText(feature, labelConfig);
    if (!labelText) return {};

    const fontParts = [];
    if (labelConfig.fontSize) fontParts.push(`${labelConfig.fontSize}px`);
    fontParts.push(labelConfig.font || "sans-serif");

    return {
      label: labelText,
      labelColor: labelConfig.color || "#1e293b",
      labelFont: fontParts.join(" "),
      labelOffsetY: labelConfig.offsetY ?? -15,
    };
  }

  /**
   * Resolve feature label text using template or property key.
   */
  private resolveText(
    feature: MapFeature,
    labelConfig: LabelConfig,
  ): string | undefined {
    const props = feature.properties || {};

    if (labelConfig.textTemplate) {
      return labelConfig.textTemplate.replace(/\{(\w+)\}/g, (_, key) => {
        return props[key] !== undefined ? String(props[key]) : "";
      });
    }

    if (labelConfig.property && props[labelConfig.property] !== undefined) {
      return String(props[labelConfig.property]);
    }

    if (props.name) return String(props.name);
    if (props.title) return String(props.title);
    if (props.label) return String(props.label);

    return undefined;
  }
}
