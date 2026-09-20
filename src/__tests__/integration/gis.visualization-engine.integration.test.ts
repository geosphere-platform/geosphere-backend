/**
 * Visualization Engine — Integration Tests
 */

import assert from "assert";
import { VisualizationEngine, MapFeature, VisualizationConfig } from "@gis/map";

export async function runVisualizationEngineIntegrationTests() {
  const engine = new VisualizationEngine();

  const config: VisualizationConfig = {
    id: "layer-integration-config",
    name: "Integration Layer",
    layerId: "layer-integration",
    version: 1,
    defaultStyle: { fillColor: "#000000" },
    styleRules: [
      {
        id: "r1",
        type: "property",
        priority: 1,
        property: "category",
        operator: "equals",
        value: "commercial",
        style: { fillColor: "#3b82f6" },
      },
    ],
    filterRules: {
      logicalOperator: "AND",
      rules: [
        { id: "f1", field: "visibleToAll", operator: "equals", value: true },
      ],
    },
  };

  engine.registerConfig(config);

  const features: MapFeature[] = [
    {
      id: "feat-1",
      geometry: { type: "Point", coordinates: [73.85, 18.52] },
      properties: { category: "commercial", visibleToAll: true },
    },
    {
      id: "feat-2",
      geometry: { type: "Point", coordinates: [72.87, 19.07] },
      properties: { category: "residential", visibleToAll: false },
    },
  ];

  const processedBatch = engine.processFeatureBatch(
    features,
    "layer-integration",
    10,
  );
  assert.strictEqual(
    processedBatch.length,
    1,
    "Only features satisfying the filter rule should pass processing pipeline",
  );
  assert.strictEqual(processedBatch[0].id, "feat-1");
  assert.strictEqual(processedBatch[0].style?.fillColor, "#3b82f6");

  // Dynamic style rule update without recreating the map or engine
  const updatedConfig: VisualizationConfig = {
    ...config,
    styleRules: [
      {
        id: "r1-updated",
        type: "property",
        priority: 1,
        property: "category",
        operator: "equals",
        value: "commercial",
        style: { fillColor: "#10b981" },
      },
    ],
  };

  engine.registerConfig(updatedConfig);
  const updatedBatch = engine.processFeatureBatch(
    features,
    "layer-integration",
    10,
  );
  assert.strictEqual(
    updatedBatch[0].style?.fillColor,
    "#10b981",
    "Dynamic style configuration update should apply immediately",
  );
}
