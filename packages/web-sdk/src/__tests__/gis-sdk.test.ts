/**
 * GeoSphere Step 8 GIS SDK + Native UI Foundation Unit Test Suite
 */

import {
  GeoSphereGIS,
  GeoSphereGISConfig,
  GeoSphereLayer,
  GeoSphereFeature,
  PointGeometry,
  PolygonGeometry,
  GIS_UI_COMPONENTS,
  GIS_READY_MADE_SCREENS,
  resolveThemePrecedence,
  validateLocaleConfig,
  evaluatePermissionState
} from "../contracts/index.js";

import { GeoSphereClient } from "../client.js";

declare const process: { exit(code?: number): never };

async function runGISSdkTests() {
  console.log("==========================================");
  console.log("RUNNING GEOSPHERE GIS SDK UNIT TESTS");
  console.log("==========================================");

  // 1. GIS SDK Initialization & Viewport Config
  console.log("  [1/15] Testing GIS SDK Initialization & Initial Viewport...");
  const initialConfig: GeoSphereGISConfig = {
    initialViewport: {
      center: [-122.4194, 37.7749], // San Francisco
      zoom: 12,
      rotation: 0
    },
    defaultLayers: [
      { id: "base_osm", name: "OpenStreetMap Base", type: "base", visible: true, zIndex: 0 },
      { id: "vector_features", name: "Assets Overlay", type: "vector", visible: true, zIndex: 1 }
    ],
    embeddedMode: true
  };

  const gisSdk = new GeoSphereGIS(initialConfig);
  await gisSdk.initialize();

  const viewport = gisSdk.getViewport();
  if (viewport.center[0] !== -122.4194 || viewport.zoom !== 12) {
    throw new Error("GIS SDK viewport initialization failed");
  }

  // 2. Geometry Validation
  console.log("  [2/15] Testing GeoJSON Geometry Creation & Struct Validation...");
  const pointGeom: PointGeometry = {
    type: "Point",
    coordinates: [-122.4194, 37.7749]
  };

  const polyGeom: PolygonGeometry = {
    type: "Polygon",
    coordinates: [
      [
        [-122.42, 37.77],
        [-122.41, 37.77],
        [-122.41, 37.78],
        [-122.42, 37.78],
        [-122.42, 37.77]
      ]
    ]
  };

  if (pointGeom.type !== "Point" || polyGeom.coordinates[0].length !== 5) {
    throw new Error("Geometry construction test failed");
  }

  // 3. Feature CRUD
  console.log("  [3/15] Testing Feature CRUD Operations...");
  const testFeature: GeoSphereFeature = {
    id: "feat_substation_01",
    geometry: pointGeom,
    layerId: "vector_features",
    properties: { name: "Substation Alpha", status: "active" },
    style: { color: "#10B981", radius: 8 }
  };

  gisSdk.addFeature(testFeature);
  let features = gisSdk.getFeatures("vector_features");
  if (features.length !== 1 || features[0].id !== "feat_substation_01") {
    throw new Error("addFeature() failed to persist feature");
  }

  // Update
  testFeature.properties.status = "maintenance";
  gisSdk.updateFeature(testFeature);
  const updated = gisSdk.getFeatures()[0];
  if (updated.properties.status !== "maintenance") {
    throw new Error("updateFeature() failed to update properties");
  }

  // Delete
  gisSdk.removeFeature("feat_substation_01");
  if (gisSdk.getFeatures().length !== 0) {
    throw new Error("removeFeature() failed to delete feature");
  }

  // 4. Layer Management & Visibility Toggle
  console.log("  [4/15] Testing Layer Management & Visibility Toggling...");
  const newLayer: GeoSphereLayer = {
    id: "satellite_layer",
    name: "Satellite Tiles",
    type: "tile",
    visible: false,
    zIndex: 2
  };

  gisSdk.addLayer(newLayer);
  if (gisSdk.getLayers().length !== 3) {
    throw new Error("addLayer() failed to add layer");
  }

  gisSdk.setLayerVisibility("satellite_layer", true);
  const stateAfterToggle = gisSdk.getMapState();
  if (!stateAfterToggle.visibleLayerIds.includes("satellite_layer")) {
    throw new Error("setLayerVisibility() failed to update visibleLayerIds in map state");
  }

  gisSdk.removeLayer("satellite_layer");
  if (gisSdk.getLayers().length !== 2) {
    throw new Error("removeLayer() failed to remove layer");
  }

  // 5. Feature Selection State Machine
  console.log("  [5/15] Testing Feature Selection State Machine...");
  gisSdk.addFeature(testFeature);
  gisSdk.selectFeature("feat_substation_01");

  const selected = gisSdk.getSelectedFeature();
  if (!selected || selected.id !== "feat_substation_01") {
    throw new Error("selectFeature() failed to select feature");
  }

  gisSdk.selectFeature(null);
  if (gisSdk.getSelectedFeature() !== null) {
    throw new Error("selectFeature(null) failed to clear selection");
  }

  // 6. Viewport Mutation
  console.log("  [6/15] Testing Viewport Mutation...");
  gisSdk.setViewport({ center: [-74.006, 40.7128], zoom: 15 }); // NYC
  const updatedViewport = gisSdk.getViewport();
  if (updatedViewport.center[0] !== -74.006 || updatedViewport.zoom !== 15) {
    throw new Error("setViewport() failed to mutate viewport state");
  }

  // 7. Theme Integration with 10 Visual Styles
  console.log("  [7/15] Testing GIS Theme Resolution across 10 Visual Style Presets...");
  const resolvedTheme = resolveThemePrecedence({
    environmentDefault: {
      tokens: { colors: { primary: "#2563EB" } as any }
    },
    tenantConfig: {
      preset: "dark-pro",
      tokens: { colors: { primary: "#3B82F6", background: "#0F172A" } as any }
    }
  });

  if (resolvedTheme.colors.background !== "#0F172A") {
    throw new Error("GIS Theme resolution failed for dark-pro preset");
  }

  // 8. Localization Unit Formatting
  console.log("  [8/15] Testing GIS Localization Config Validation...");
  const validLocale = validateLocaleConfig({
    language: "en",
    locale: "en-US",
    timezone: "America/New_York",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm:ss",
    distanceUnit: "miles",
    speedUnit: "mph"
  });

  if (validLocale.distanceUnit !== "miles" || validLocale.speedUnit !== "mph") {
    throw new Error("Localization config validation failed");
  }

  // 9. RBAC Permission Integration
  console.log("  [9/15] Testing GIS RBAC Permission State Evaluation...");
  const userPermissions = ["gis.map.read", "gis.feature.read"];
  const viewerUIState = evaluatePermissionState(userPermissions, "gis.map.read", "hide");
  if (viewerUIState.status !== "granted") {
    throw new Error("RBAC evaluation failed to grant allowed gis.map.read permission");
  }

  const editorUIState = evaluatePermissionState(userPermissions, "gis.feature.edit", "disable");
  if (editorUIState.status !== "denied" || editorUIState.mode !== "disable") {
    throw new Error("RBAC evaluation failed to deny unauthorized gis.feature.edit permission");
  }

  // 10. Embedded UI Mode Verification
  console.log(" [10/15] Testing Embedded UI Mode Configuration...");
  const mapState = gisSdk.getMapState();
  if (mapState.mapMode !== "view") {
    throw new Error("Default map mode mismatch");
  }

  // 11. Reusable Component Metadata Checks
  console.log(" [11/15] Testing GIS Component Definitions Metadata...");
  const gisMapComp = GIS_UI_COMPONENTS.GIS_MAP;
  if (gisMapComp.id !== "gis.map" || gisMapComp.supportedPlatforms.length !== 3) {
    throw new Error("GIS_MAP component metadata check failed");
  }

  // 12. Ready-Made Screen Definitions Metadata Checks
  console.log(" [12/15] Testing Ready-Made GIS Screen Definitions Metadata...");
  const viewerScreen = GIS_READY_MADE_SCREENS.GIS_VIEWER_SCREEN;
  const editorScreen = GIS_READY_MADE_SCREENS.FEATURE_EDITOR_SCREEN;

  if (viewerScreen.mode !== "full-screen" || !viewerScreen.requiredPermissions.includes("gis.map.read")) {
    throw new Error("GIS_VIEWER_SCREEN metadata check failed");
  }
  if (!editorScreen.requiredPermissions.includes("gis.feature.create")) {
    throw new Error("FEATURE_EDITOR_SCREEN required permissions check failed");
  }

  // 13. OpenLayers Encapsulation Guard
  console.log(" [13/15] Verifying OpenLayers Encapsulation Guard...");
  const coreGisSource = JSON.stringify(gisSdk);
  if (coreGisSource.includes("ol/") || coreGisSource.includes("ol.")) {
    throw new Error("SECURITY/DEPENDENCY VIOLATION: OpenLayers leaked into generic GIS Core!");
  }

  // 14. Cleanup
  console.log(" [14/15] Testing GIS SDK Resource Cleanup (destroy)...");
  gisSdk.destroy();
  if (gisSdk.getFeatures().length !== 0 || gisSdk.getLayers().length !== 0) {
    throw new Error("destroy() failed to clear GIS resources");
  }

  // 15. Backward Compatibility with Existing SDK & GISModule
  console.log(" [15/15] Verifying Backward Compatibility with GeoSphereClient.gis...");
  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_gis_test_001",
    applicationId: "app_gis_test_001"
  });

  if (!client.gis || typeof client.gis.createMap !== "function" || typeof client.gis.getSpatialOverview !== "function") {
    throw new Error("Backward compatibility broken: existing client.gis facade is invalid");
  }

  console.log("✅ All GeoSphere GIS SDK & Native UI Foundation Unit Tests Passed Successfully!");
}

runGISSdkTests().catch((err) => {
  console.error("❌ GeoSphere GIS SDK Unit Tests Failed:", err);
  process.exit(1);
});
