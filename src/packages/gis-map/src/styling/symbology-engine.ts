/**
 * GeoSphere Platform — Advanced Universal GIS Symbology & Style Engine
 *
 * Provides business-agnostic, platform-neutral GIS symbology contracts,
 * rule-based attribute classification (Categorized, Graduated), point symbol shapes,
 * line dash patterns/caps/joins, label styling with halos and collision policies,
 * zoom-dependent rendering, and style presets for Web + Android + iOS.
 */

export type PointSymbolShape = "Circle" | "Square" | "Triangle" | "Star" | "SVG" | "Image" | "Emoji";
export type LineDashPattern = "Solid" | "Dashed" | "Dotted" | "Dash-Dot";
export type LineCapType = "Butt" | "Round" | "Square";
export type LineJoinType = "Miter" | "Round" | "Bevel";
export type PolygonPatternType = "Solid" | "Transparent" | "Hatch" | "CrossHatch" | "Dots";

export interface GeoSphereSymbol {
  shape: PointSymbolShape;
  size: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  rotation: number;
  opacity: number;
  svgContent?: string;
  imageUrl?: string;
  emoji?: string;
}

export interface GeoSphereLabelStyle {
  enabled: boolean;
  field: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold" | "100" | "300" | "600" | "800";
  color: string;
  haloColor: string;
  haloWidth: number;
  placement: "top" | "center" | "bottom" | "left" | "right";
  offsetY: number;
  minZoom?: number;
  maxZoom?: number;
  collisionAvoidance: boolean;
}

export interface GeoSphereRuleCondition {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "in_range";
  value: any;
}

export interface GeoSphereRule {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  condition: GeoSphereRuleCondition;
  style: Partial<GeoSphereStyle>;
}

export interface GeoSphereClassificationCategory {
  value: string | number;
  label: string;
  color: string;
}

export interface GeoSphereClassificationRange {
  min: number;
  max: number;
  label: string;
  color: string;
  size?: number;
}

export interface GeoSphereClassification {
  type: "NONE" | "CATEGORIZED" | "GRADUATED";
  field: string;
  categories?: GeoSphereClassificationCategory[];
  ranges?: GeoSphereClassificationRange[];
}

export interface GeoSphereStyle {
  id: string;
  name: string;
  layerId?: string;
  geometryType: "Point" | "LineString" | "Polygon" | "ALL";

  // Point Symbology
  pointSymbol: GeoSphereSymbol;

  // Line Symbology
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  dashPattern: LineDashPattern;
  lineCap: LineCapType;
  lineJoin: LineJoinType;
  lineOffset?: number;
  casingColor?: string;
  casingWidth?: number;

  // Polygon Symbology
  fillColor: string;
  fillOpacity: number;
  pattern: PolygonPatternType;
  patternDensity?: number;

  // Labels & Zoom
  labelStyle: GeoSphereLabelStyle;
  minZoom: number;
  maxZoom: number;

  // Attribute Rules & Classification
  rules: GeoSphereRule[];
  classification: GeoSphereClassification;
}

export const DEFAULT_GEOSPHERE_STYLE: GeoSphereStyle = {
  id: "default_style",
  name: "Default Symbology",
  geometryType: "ALL",
  pointSymbol: {
    shape: "Circle",
    size: 8,
    color: "#3b82f6",
    borderColor: "#ffffff",
    borderWidth: 2,
    rotation: 0,
    opacity: 1,
  },
  strokeColor: "#2563eb",
  strokeWidth: 2,
  strokeOpacity: 1,
  dashPattern: "Solid",
  lineCap: "Round",
  lineJoin: "Round",
  fillColor: "#3b82f6",
  fillOpacity: 0.25,
  pattern: "Solid",
  labelStyle: {
    enabled: true,
    field: "name",
    fontFamily: "Inter, sans-serif",
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
    haloColor: "#0f172a",
    haloWidth: 3,
    placement: "top",
    offsetY: -14,
    minZoom: 1,
    maxZoom: 22,
    collisionAvoidance: true,
  },
  minZoom: 1,
  maxZoom: 22,
  rules: [],
  classification: {
    type: "NONE",
    field: "status",
  },
};

/**
 * Evaluates effective styling for a feature based on rules and classification.
 */
export class GeoSphereSymbologyEvaluator {
  public static evaluateFeatureStyle(feature: any, baseStyle: GeoSphereStyle): GeoSphereStyle {
    let effective = { ...baseStyle };

    // 1. Classification Evaluation
    if (baseStyle.classification.type === "CATEGORIZED" && baseStyle.classification.categories) {
      const val = feature.properties?.[baseStyle.classification.field];
      const match = baseStyle.classification.categories.find((c) => String(c.value) === String(val));
      if (match) {
        effective.fillColor = match.color;
        effective.strokeColor = match.color;
        effective.pointSymbol = { ...effective.pointSymbol, color: match.color };
      }
    } else if (baseStyle.classification.type === "GRADUATED" && baseStyle.classification.ranges) {
      const val = Number(feature.properties?.[baseStyle.classification.field] ?? 0);
      const match = baseStyle.classification.ranges.find((r) => val >= r.min && val <= r.max);
      if (match) {
        effective.fillColor = match.color;
        effective.strokeColor = match.color;
        if (match.size) {
          effective.pointSymbol = { ...effective.pointSymbol, size: match.size };
        }
      }
    }

    // 2. Rule Evaluation (Sorted by Priority Descending)
    if (baseStyle.rules && baseStyle.rules.length > 0) {
      const activeRules = [...baseStyle.rules]
        .filter((r) => r.enabled)
        .sort((a, b) => b.priority - a.priority);

      for (const rule of activeRules) {
        const propVal = feature.properties?.[rule.condition.field];
        let matches = false;

        switch (rule.condition.operator) {
          case "equals":
            matches = String(propVal) === String(rule.condition.value);
            break;
          case "not_equals":
            matches = String(propVal) !== String(rule.condition.value);
            break;
          case "greater_than":
            matches = Number(propVal) > Number(rule.condition.value);
            break;
          case "less_than":
            matches = Number(propVal) < Number(rule.condition.value);
            break;
          case "contains":
            matches = String(propVal ?? "").toLowerCase().includes(String(rule.condition.value).toLowerCase());
            break;
        }

        if (matches) {
          effective = {
            ...effective,
            ...rule.style,
            pointSymbol: rule.style.pointSymbol ? { ...effective.pointSymbol, ...rule.style.pointSymbol } : effective.pointSymbol,
          };
          break;
        }
      }
    }

    return effective;
  }
}
