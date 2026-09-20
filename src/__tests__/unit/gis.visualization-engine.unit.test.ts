/**
 * Visualization Engine — Unit Tests
 */

import assert from "assert";
import {
  VisualizationEngine,
  StyleEngine,
  FilterEngine,
  LabelEngine,
  LegendEngine,
  ClusterEngine,
  HeatmapEngine,
  LayerTreeManager,
  VisualizationConfig,
  MapFeature,
} from "@gis/map";

export function runVisualizationEngineUnitTests() {
  // 1. Layer Tree Hierarchy & Grouping
  const treeMgr = new LayerTreeManager(
    [
      { id: "group-infra", name: "Infrastructure", visible: true, order: 1 },
      { id: "group-env", name: "Environment", visible: true, order: 2 },
    ],
    [
      {
        id: "layer-roads",
        name: "Roads",
        type: "vector",
        visible: true,
        opacity: 1,
        zIndex: 10,
        groupId: "group-infra",
      },
      {
        id: "layer-trees",
        name: "Trees",
        type: "vector",
        visible: true,
        opacity: 1,
        zIndex: 5,
        groupId: "group-env",
      },
    ],
  );

  const tree = treeMgr.buildTree();
  assert.strictEqual(tree.length, 2, "Should contain 2 root group nodes");
  assert.strictEqual(
    tree[0].children?.length,
    1,
    "Infrastructure group should contain Roads layer",
  );

  // Group visibility toggle propagation
  const affected = treeMgr.toggleGroupVisibility("group-infra", false);
  assert.strictEqual(
    affected.length,
    1,
    "Toggling group should update 1 layer",
  );
  assert.strictEqual(
    affected[0].visible,
    false,
    "Roads layer should be hidden",
  );

  // 2. StyleEngine Evaluation & Priority
  const styleEngine = new StyleEngine();
  const vizConfig: VisualizationConfig = {
    id: "test-config",
    name: "Test Config",
    layerId: "layer-test",
    version: 1,
    defaultStyle: { fillColor: "#cccccc", circleRadius: 6 },
    styleRules: [
      {
        id: "rule-low-priority",
        type: "property",
        priority: 1,
        property: "status",
        operator: "equals",
        value: "active",
        style: { fillColor: "#0000ff" },
      },
      {
        id: "rule-high-priority",
        type: "property",
        priority: 10,
        property: "status",
        operator: "equals",
        value: "active",
        style: { fillColor: "#ff0000" },
      },
      {
        id: "rule-speed",
        type: "numeric_range",
        priority: 5,
        property: "speed",
        min: 50,
        max: 100,
        style: { circleRadius: 15 },
      },
    ],
  };

  const activeFeature: MapFeature = {
    id: "f1",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: { status: "active", speed: 60 },
  };

  const styleResult = styleEngine.evaluateStyle(activeFeature, vizConfig);
  assert.strictEqual(
    styleResult.fillColor,
    "#ff0000",
    "Higher priority rule should override lower priority rule",
  );

  // 3. FilterEngine Evaluation (AND / OR)
  const filterEngine = new FilterEngine();
  const testFeatures: MapFeature[] = [
    {
      id: "f1",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { status: "active", speed: 70 },
    },
    {
      id: "f2",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { status: "active", speed: 30 },
    },
    {
      id: "f3",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { status: "inactive", speed: 80 },
    },
  ];

  const andFiltered = filterEngine.filterFeatures(testFeatures, {
    logicalOperator: "AND",
    rules: [
      { id: "r1", field: "status", operator: "equals", value: "active" },
      { id: "r2", field: "speed", operator: "greater_than", value: 50 },
    ],
  });
  assert.strictEqual(andFiltered.length, 1, "AND filter should return only f1");
  assert.strictEqual(andFiltered[0].id, "f1");

  const filterDefs = filterEngine.generateFilterDefinitions(testFeatures);
  assert.strictEqual(
    filterDefs.length,
    2,
    "Should generate filter metadata for 2 properties",
  );

  // 4. LabelEngine Zoom Rules & Templates
  const labelEngine = new LabelEngine();
  const labelFeat: MapFeature = {
    id: "f-lbl",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties: { name: "Station Alpha", code: "SA-01" },
  };

  const labelZoomHidden = labelEngine.evaluateLabel(
    labelFeat,
    { enabled: true, property: "name", minZoom: 10, maxZoom: 18 },
    5,
  );
  assert.strictEqual(
    labelZoomHidden.label,
    undefined,
    "Label should be hidden below minZoom",
  );

  const labelZoomVisible = labelEngine.evaluateLabel(
    labelFeat,
    {
      enabled: true,
      textTemplate: "{name} ({code})",
      minZoom: 10,
      maxZoom: 18,
    },
    12,
  );
  assert.strictEqual(
    labelZoomVisible.label,
    "Station Alpha (SA-01)",
    "Template text should resolve accurately within zoom limits",
  );

  // 5. LegendEngine Synthesis
  const legendEngine = new LegendEngine();
  const legend = legendEngine.generateLegend(vizConfig);
  assert.strictEqual(
    legend.items?.length,
    3,
    "Legend should contain 3 items for the style rules",
  );

  // 6. ClusterEngine & HeatmapEngine Normalization
  const clusterEngine = new ClusterEngine();
  assert.strictEqual(
    clusterEngine.isClusterActiveAtZoom(
      { enabled: true, minZoom: 5, maxZoom: 12 },
      15,
    ),
    false,
    "Cluster should be inactive outside zoom limits",
  );

  const heatmapEngine = new HeatmapEngine();
  const nullWeightVal = heatmapEngine.calculateNormalizedWeight(
    {
      id: "h1",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: {},
    },
    { enabled: true, weightField: "value", weightMin: 0, weightMax: 100 },
  );
  assert.strictEqual(
    nullWeightVal,
    0.1,
    "Missing weight property should return safe fallback non-zero weight",
  );

  const NaNWeightVal = heatmapEngine.calculateNormalizedWeight(
    {
      id: "h2",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { value: "invalid" },
    },
    { enabled: true, weightField: "value", weightMin: 0, weightMax: 100 },
  );
  assert.strictEqual(
    NaNWeightVal,
    0.1,
    "NaN weight property should return safe fallback non-zero weight",
  );

  // 7. Full Visualization Engine Integration
  const vizEngine = new VisualizationEngine();
  vizEngine.registerConfig(vizConfig);
  const processed = vizEngine.processFeature(activeFeature, "layer-test", 12);
  assert.strictEqual(
    processed.visible,
    true,
    "Processed feature should be visible",
  );
  assert.strictEqual(
    processed.style.fillColor,
    "#ff0000",
    "Processed style should match priority rule",
  );
}
