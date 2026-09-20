/**
 * Visualization Engine — Performance Verification Tests
 *
 * Verifies performance target for processing 1,000, 5,000, and 10,000 active spatial features.
 */

import assert from "assert";
import { VisualizationEngine, MapFeature, VisualizationConfig } from "@gis/map";

export async function runVisualizationPerformanceTests() {
  const engine = new VisualizationEngine();

  const config: VisualizationConfig = {
    id: "perf-config",
    name: "Performance Test Layer",
    layerId: "layer-perf",
    version: 1,
    defaultStyle: { fillColor: "#64748b", circleRadius: 6 },
    styleRules: [
      {
        id: "r-high",
        type: "numeric_range",
        priority: 10,
        property: "val",
        min: 800,
        max: 1000,
        style: { fillColor: "#ef4444" },
      },
      {
        id: "r-mid",
        type: "numeric_range",
        priority: 5,
        property: "val",
        min: 400,
        max: 799,
        style: { fillColor: "#f59e0b" },
      },
      {
        id: "r-low",
        type: "numeric_range",
        priority: 1,
        property: "val",
        min: 0,
        max: 399,
        style: { fillColor: "#10b981" },
      },
    ],
    filterRules: {
      logicalOperator: "AND",
      rules: [
        { id: "f-active", field: "active", operator: "equals", value: true },
      ],
    },
  };

  engine.registerConfig(config);

  const generateMockDataset = (count: number): MapFeature[] => {
    const arr: MapFeature[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: `perf-feat-${i}`,
        geometry: {
          type: "Point",
          coordinates: [
            73.85 + (Math.random() - 0.5) * 0.5,
            18.52 + (Math.random() - 0.5) * 0.5,
          ],
        },
        properties: {
          val: Math.floor(Math.random() * 1000),
          active: i % 10 !== 0, // 90% active
        },
      });
    }
    return arr;
  };

  const featureCounts = [1000, 5000, 10000];

  for (const count of featureCounts) {
    const dataset = generateMockDataset(count);
    const start = performance.now();
    const result = engine.processFeatureBatch(dataset, "layer-perf", 10);
    const elapsed = performance.now() - start;

    console.log(
      `   --> Processed ${count} features (${result.length} passed filter) in ${elapsed.toFixed(2)}ms`,
    );
    assert.strictEqual(
      result.length > 0,
      true,
      "Filtered dataset should contain valid features",
    );
    assert.strictEqual(
      elapsed < 500,
      true,
      `Performance target failed: ${count} features took ${elapsed}ms (limit: 500ms)`,
    );
  }
}
