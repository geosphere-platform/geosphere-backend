/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect } from "vitest";
import {
  GeoSphereSymbologyEvaluator,
  DEFAULT_GEOSPHERE_STYLE,
  GeoSphereStyle,
} from "./symbology-engine";
import { GEOSPHERE_STYLE_PRESETS, GeoSphereStyleSerializer } from "./style-preset-registry";

describe("GeoSphere Enterprise GIS Symbology & Style Engine", () => {
  it("Rule Evaluation: Applies highest priority matching rule to feature", () => {
    const customStyle: GeoSphereStyle = {
      ...DEFAULT_GEOSPHERE_STYLE,
      rules: [
        {
          id: "r1",
          name: "Active Rule",
          priority: 10,
          enabled: true,
          condition: { field: "status", operator: "equals", value: "ACTIVE" },
          style: { fillColor: "#10b981", strokeColor: "#10b981" },
        },
        {
          id: "r2",
          name: "Critical Rule",
          priority: 20, // Higher priority!
          enabled: true,
          condition: { field: "status", operator: "equals", value: "CRITICAL" },
          style: { fillColor: "#ef4444", strokeColor: "#ef4444" },
        },
      ],
    };

    const criticalFeature = { properties: { status: "CRITICAL" } };
    const evaluated = GeoSphereSymbologyEvaluator.evaluateFeatureStyle(criticalFeature, customStyle);
    expect(evaluated.fillColor).toBe("#ef4444");

    const activeFeature = { properties: { status: "ACTIVE" } };
    const evaluatedActive = GeoSphereSymbologyEvaluator.evaluateFeatureStyle(activeFeature, customStyle);
    expect(evaluatedActive.fillColor).toBe("#10b981");
  });

  it("Categorized Classification: Applies category color by property value", () => {
    const categorizedStyle: GeoSphereStyle = {
      ...DEFAULT_GEOSPHERE_STYLE,
      classification: {
        type: "CATEGORIZED",
        field: "type",
        categories: [
          { value: "Substation", label: "Substation", color: "#8b5cf6" },
          { value: "Feeder", label: "Feeder", color: "#f59e0b" },
        ],
      },
    };

    const feature = { properties: { type: "Substation" } };
    const evaluated = GeoSphereSymbologyEvaluator.evaluateFeatureStyle(feature, categorizedStyle);
    expect(evaluated.fillColor).toBe("#8b5cf6");
  });

  it("Presets Registry: Contains all required enterprise presets", () => {
    expect(GEOSPHERE_STYLE_PRESETS.length).toBeGreaterThan(3);
    const darkPreset = GEOSPHERE_STYLE_PRESETS.find((p) => p.id === "preset_dark_gis");
    expect(darkPreset).toBeDefined();
    expect(darkPreset?.style.strokeColor).toBe("#06b6d4");
  });

  it("JSON Import / Export: Roundtrips GeoSphereStyle cleanly", () => {
    const exportedJson = GeoSphereStyleSerializer.exportToJSON(DEFAULT_GEOSPHERE_STYLE);
    expect(exportedJson).toContain("schemaVersion");

    const reimported = GeoSphereStyleSerializer.importFromJSON(exportedJson);
    expect(reimported.name).toBe(DEFAULT_GEOSPHERE_STYLE.name);
    expect(reimported.pointSymbol.shape).toBe(DEFAULT_GEOSPHERE_STYLE.pointSymbol.shape);
  });
});
