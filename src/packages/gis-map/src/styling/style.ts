/**
 * GIS Map SDK — Styling Abstractions & Primitives
 */

import { FeatureStyle } from "../types";

export const DEFAULT_FEATURE_STYLE: Required<FeatureStyle> = {
  fillColor: "#3b82f6",
  fillOpacity: 0.2,
  strokeColor: "#2563eb",
  strokeWidth: 2,
  strokeDashArray: [],
  circleRadius: 7,
  iconUrl: "",
  iconScale: 1,
  iconRotation: 0,
  label: "",
  labelColor: "#1e293b",
  labelFont: "12px sans-serif",
  labelOffsetY: -14,
  zIndex: 1,
};

export function createFeatureStyle(
  overrides?: Partial<FeatureStyle>,
): FeatureStyle {
  return {
    ...DEFAULT_FEATURE_STYLE,
    ...overrides,
  };
}

export function mergeStyles(
  ...styles: (FeatureStyle | undefined)[]
): FeatureStyle {
  return styles.reduce<FeatureStyle>((acc, curr) => {
    if (!curr) return acc;
    return { ...acc, ...curr };
  }, {});
}
